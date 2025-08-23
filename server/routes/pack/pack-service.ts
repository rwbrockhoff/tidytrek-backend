import db from '../../db/connection.js';
import { Tables } from '../../db/tables.js';
import { DEFAULT_PALETTE_COLOR, DEFAULT_PALETTE } from '../../utils/constants.js';
import { validateWeightUnit, validatePrice } from './pack-utils.js';
import { packScraper } from './pack-scraper.js';
import { isError } from '../../utils/validation.js';
import {
	DEFAULT_INCREMENT,
	getNextAppendIndex,
	moveWithFractionalIndex,
	bulkMoveToGearCloset,
	type MovablePackItem,
} from '../../utils/fractional-indexing/index.js';
import { logger } from '../../config/logger.js';
import { packFields, packItemFields, packCategoryFields } from './pack-schemas.js';
import { getUserSettingsData } from '../../services/user-service.js';

export async function getPackWithCategories(userId: string, packId: number) {
	const pack = await db(Tables.Pack)
		.select(packFields)
		.where('user_id', userId)
		.where('pack_id', packId)
		.orderBy('created_at')
		.first();

	// Gets categories for a pack ordered by category index
	// Groups all pack items for each category ordered by pack item index
	// Build pack item JSON object for aggregation
	const packItemJson = packItemFields.map((f) => `'${f}', pi.${f}`).join(', ');

	const result = await db.raw(
		`select 
			pc.*, 
			COALESCE(
				json_agg(
					json_build_object(${packItemJson})
					ORDER BY pi.pack_item_index::NUMERIC
				) FILTER (WHERE pi.pack_item_id IS NOT NULL),
				'[]'::json
			) as pack_items 
			from pack_category pc
			left outer join pack_item pi on pi.pack_category_id = pc.pack_category_id	
		where pc.user_id = ? and pc.pack_id = ?
		group by pc.pack_category_id
		order by pc.pack_category_index::NUMERIC`,
		[userId, packId],
	);
	const { rows: categories = [] } = result;

	return { pack: pack || null, categories };
}

export async function createNewPack(userId: string) {
	const userSettings = await getUserSettingsData(userId);
	const defaultPalette = userSettings?.palette || DEFAULT_PALETTE;

	// Calculate index for new pack (append to end of user's pack list)
	const packIndex = await getNextAppendIndex(Tables.Pack, 'pack_index', {
		user_id: userId,
	});

	const trx = await db.transaction();
	try {
		const [pack] = await trx(Tables.Pack)
			.insert({
				user_id: userId,
				pack_name: 'New Pack',
				pack_index: packIndex,
				palette: defaultPalette,
			})
			.returning(packFields);

		const categories = await trx(Tables.PackCategory)
			.insert({
				user_id: userId,
				pack_id: pack.pack_id,
				pack_category_name: '',
				pack_category_index: DEFAULT_INCREMENT.toString(),
				pack_category_color: DEFAULT_PALETTE_COLOR,
			})
			.returning(packCategoryFields);

		const packItems = await trx(Tables.PackItem)
			.insert({
				user_id: userId,
				pack_id: pack.pack_id,
				pack_category_id: categories[0].pack_category_id,
				pack_item_name: '',
				pack_item_index: DEFAULT_INCREMENT.toString(),
			})
			.returning(packItemFields);

		const categoriesWithItems = categories.map((cat, index) => ({
			...cat,
			pack_items: index === 0 ? packItems : [],
		}));

		await trx.commit();
		return { pack, categories: categoriesWithItems };
	} catch (err) {
		await trx.rollback();
		throw new Error('There was an error creating a new pack.');
	}
}

export async function importPackFromUrl(
	userId: string,
	pack_url: string,
	palette_list?: string[],
) {
	const importedPack = await packScraper(pack_url);

	// handle error
	const isPackError = isError(importedPack);
	if (isPackError) {
		logger.warn('Pack import failed - invalid pack data', {
			userId,
			packUrl: pack_url,
			error: 'Pack scraper returned error or invalid data',
			scrapedData: importedPack,
		});
		throw new Error('Pack scraper returned error or invalid data');
	}

	// save new pack to db
	const { pack_name, pack_description, pack_categories } = importedPack;

	// Calculate index for new imported pack (append to end of user's pack list)
	const packIndex = await getNextAppendIndex(Tables.Pack, 'pack_index', {
		user_id: userId,
	});

	const trx = await db.transaction();
	try {
		// insert pack
		const [{ pack_id }] = await trx(Tables.Pack)
			.insert({
				user_id: userId,
				pack_name,
				pack_description,
				pack_index: packIndex,
			})
			.returning('pack_id');

		// insert categories and pack items sequentially
		for (const category of pack_categories) {
			const { pack_category_name, pack_category_index, pack_items } = category;

			// get theme color based on index
			const themeColor = palette_list?.[pack_category_index % palette_list.length];

			// assign provided palette or default
			const pack_category_color = isError(themeColor)
				? DEFAULT_PALETTE_COLOR
				: themeColor;

			// insert pack category
			const [{ pack_category_id }] = await trx(Tables.PackCategory)
				.insert({
					user_id: userId,
					pack_id,
					pack_category_name,
					pack_category_index: pack_category_index.toString(),
					pack_category_color,
				})
				.returning('pack_category_id');

			// insert pack items
			if (pack_items.length > 0) {
				const packItemsWithIds = pack_items.map((item) => ({
					...item,
					user_id: userId,
					pack_id,
					pack_category_id,
					pack_item_index: item.pack_item_index?.toString(),
					pack_item_weight_unit: validateWeightUnit(item.pack_item_weight_unit),
					pack_item_price: validatePrice(item.pack_item_price),
				}));
				await trx(Tables.PackItem).insert(packItemsWithIds);
			}
		}

		await trx.commit();

		logger.info('User imported external pack successfully', {
			userId,
			packUrl: pack_url,
		});

		return { success: true };
	} catch (error) {
		await trx.rollback();
		throw new Error('Failed to import pack');
	}
}

export async function movePackInList(
	userId: string,
	packId: string,
	prev_pack_index?: string,
	next_pack_index?: string,
) {
	const { newIndex, rebalanced } = await moveWithFractionalIndex(
		Tables.Pack,
		'pack_index',
		'pack_id',
		packId,
		prev_pack_index,
		next_pack_index,
		{ user_id: userId }, // WHERE conditions
	);

	return {
		packId,
		newIndex,
		rebalanced,
	};
}

export async function deletePackAndMoveItems(userId: string, packId: string) {
	// Get all items from the pack to move to gear closet
	const packItems = await db(Tables.PackItem)
		.select(`${Tables.PackItem}.*`)
		.join(
			Tables.PackCategory,
			`${Tables.PackItem}.pack_category_id`,
			`${Tables.PackCategory}.pack_category_id`,
		)
		.where(`${Tables.PackItem}.user_id`, userId)
		.where(`${Tables.PackItem}.pack_id`, packId)
		.orderByRaw(
			`${Tables.PackCategory}.pack_category_index::NUMERIC, ${Tables.PackItem}.pack_item_index::NUMERIC`,
		);

	await bulkMoveToGearCloset(packItems, userId);

	// DELETE ON CASCADE: pack -> pack_category -> pack_item
	await db(Tables.Pack).where('user_id', userId).where('pack_id', packId).del();

	//if no packs left, create default pack
	const response = await db(Tables.Pack)
		.select('pack_id')
		.where('user_id', userId)
		.first();
	if (!response) await createNewPack(userId);

	return { deletedPackId: packId };
}

export async function deletePackCompletely(userId: string, packId: string) {
	// DELETE ON CASCADE: pack -> pack_category -> pack_item
	await db(Tables.Pack).where('user_id', userId).where('pack_id', packId).del();

	// if no packs left, ensure user has default pack
	const response = await db(Tables.Pack)
		.select('pack_id')
		.where('user_id', userId)
		.first();
	if (!response) await createNewPack(userId);

	return { deletedPackId: packId };
}

export async function createPackItem(
	userId: string,
	pack_id: number,
	pack_category_id: number,
) {
	// Calculate index for new item
	const pack_item_index = await getNextAppendIndex(Tables.PackItem, 'pack_item_index', {
		user_id: userId,
		pack_id,
		pack_category_id,
	});

	const [packItem] =
		(await db(Tables.PackItem)
			.insert({
				user_id: userId,
				pack_id,
				pack_category_id,
				pack_item_name: '',
				pack_item_index,
			})
			.returning(packItemFields)) || [];

	return { packItem };
}

export async function movePackItemBetweenCategories(
	userId: string,
	packItemId: string,
	pack_category_id: string,
	prev_pack_category_id: string,
	prev_item_index?: string,
	next_item_index?: string,
) {
	const { newIndex, rebalanced } = await moveWithFractionalIndex(
		Tables.PackItem,
		'pack_item_index',
		'pack_item_id',
		packItemId,
		prev_item_index,
		next_item_index,
		{ user_id: userId, pack_category_id: prev_pack_category_id }, // WHERE conditions - use PREVIOUS category to find the item
		{ pack_category_id }, // Additional fields to update (can change category on drag/drop)
	);

	return {
		packItemId,
		newIndex,
		rebalanced,
		categoryChanged: prev_pack_category_id !== pack_category_id,
	};
}

export async function moveItemToGearCloset(userId: string, packItemId: string) {
	// Calculate index for item moving to gear closet
	const newGearClosetIndex = await getNextAppendIndex(
		Tables.PackItem,
		'pack_item_index',
		{
			user_id: userId,
			pack_id: null,
			pack_category_id: null,
		},
	);

	await db(Tables.PackItem)
		.update({
			pack_id: null,
			pack_category_id: null,
			pack_item_index: newGearClosetIndex,
		})
		.where('user_id', userId)
		.where('pack_item_id', packItemId);

	return { success: true };
}

export async function createPackCategory(
	userId: string,
	packId: string,
	category_color: string,
) {
	// Calculate index for new category
	const packCategoryIndex = await getNextAppendIndex(
		Tables.PackCategory,
		'pack_category_index',
		{ user_id: userId, pack_id: Number(packId) },
	);

	const [packCategory] = await db(Tables.PackCategory)
		.insert({
			pack_category_name: '',
			user_id: userId,
			pack_id: Number(packId),
			pack_category_index: packCategoryIndex.toString(),
			pack_category_color: category_color,
		})
		.returning(packCategoryFields);

	// add default pack item (can be default index for first item)
	const [packItem] = await db(Tables.PackItem)
		.insert({
			user_id: userId,
			pack_id: Number(packId),
			pack_category_id: packCategory.pack_category_id,
			pack_item_name: '',
			pack_item_index: DEFAULT_INCREMENT.toString(),
		})
		.returning(packItemFields);

	const categoryWithItems = {
		...packCategory,
		pack_items: [packItem],
	};

	return { packCategory: categoryWithItems };
}

export async function movePackCategory(
	userId: string,
	categoryId: string,
	prev_category_index?: string,
	next_category_index?: string,
) {
	const { newIndex, rebalanced } = await moveWithFractionalIndex(
		Tables.PackCategory,
		'pack_category_index',
		'pack_category_id',
		categoryId,
		prev_category_index,
		next_category_index,
		{ user_id: userId }, // WHERE conditions
	);

	return {
		packCategoryId: categoryId,
		newIndex,
		rebalanced,
	};
}

export async function moveCategoryItemsToCloset(userId: string, categoryId: string) {
	// Get all items from the category to move to gear closet
	const categoryItems = await db(Tables.PackItem)
		.select('*')
		.where('user_id', userId)
		.where('pack_category_id', categoryId)
		.orderByRaw('pack_item_index::NUMERIC');

	// Bulk move all category items to gear closet (indexes will be reassigned)
	await bulkMoveToGearCloset(categoryItems as MovablePackItem[], userId);

	await deletePackCategory(userId, categoryId);

	return { deletedId: categoryId };
}

export async function deleteCategoryAndAllItems(userId: string, categoryId: string) {
	const trx = await db.transaction();
	try {
		await trx(Tables.PackItem)
			.where('user_id', userId)
			.where('pack_category_id', categoryId)
			.del();
		await trx(Tables.PackCategory)
			.where('user_id', userId)
			.where('pack_category_id', categoryId)
			.del();
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		throw new Error('Failed to delete category and items');
	}

	return { deletedId: categoryId };
}

export async function getAvailablePacks(userId: string) {
	try {
		const { rows = [] } = await db.raw(
			`select 
			pack.pack_id, pack_name, pack_index,
			coalesce(array_remove(array_agg(to_jsonb(pc) order by pc.pack_category_index::NUMERIC), NULL), '{}') as pack_categories from pack
			left outer join pack_category pc on pc.pack_id = pack.pack_id	
		where pack.user_id = ?
		group by pack.pack_id
		order by pack.pack_index::NUMERIC`,
			[userId],
		);
		return rows;
	} catch (err) {
		throw new Error('Error getting available packs.');
	}
}

async function deletePackCategory(user_id: string, pack_category_id: number | string) {
	try {
		// Delete ON CASCADE: pack_category -> pack_item
		await db(Tables.PackCategory)
			.where('user_id', user_id)
			.where('pack_category_id', pack_category_id)
			.del();
	} catch (err) {
		throw new Error('Failed to delete category');
	}
}
