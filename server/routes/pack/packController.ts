import knex from '../../db/connection.js';
import {
	generateIndex,
	changeItemOrder,
	getMaxItemIndex,
	shiftPackItems,
} from './packUtils.js';
import { tables as t } from '../../../knexfile.js';
import { themeColorNames } from '../../utils/constraints.js';
import { Request, Response } from 'express';
import { createCloudfrontUrlForPhoto, s3DeletePhoto } from '../../utils/s3.js';
import { packScraper } from '../../utils/puppeteer.js';
import { isError } from '../../utils/utils.js';

async function getDefaultPack(req: Request, res: Response) {
	try {
		const { userId } = req;

		const { packId: defaultPackId } =
			(await knex(t.pack)
				.select('pack_id')
				.where({ user_id: userId })
				.orderBy('pack_index')
				.first()) || {};

		if (defaultPackId) {
			const { pack, categories } = await getPackById(userId, defaultPackId);

			return res.status(200).json({ pack, categories });
		} else {
			// UI can handle not having a default pack.
			return res.status(200).send();
		}
	} catch (err) {
		res.status(400).json({ error: "We're having trouble loading your packs right now." });
	}
}

async function getPack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const { pack, categories } = await getPackById(userId, Number(packId));

		return res.status(200).json({ pack, categories });
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error loading your pack right now.' });
	}
}

async function getPackById(userId: string, packId: number) {
	const pack = await knex(t.pack)
		.where({ user_id: userId, pack_id: packId })
		.orderBy('created_at')
		.first();

	// Gets categories for a pack ordered by category index
	// Groups all pack items for each category ordered by pack item index
	const categories = await knex.raw(
		`select 
			pc.*, 
			coalesce(array_remove(array_agg(to_jsonb(pi) order by pack_item_index), NULL), '{}') as pack_items 
			from pack_category pc
			left outer join pack_item pi on pi.pack_category_id = pc.pack_category_id	
		where pc.user_id = '${userId}' and pc.pack_id = ${packId}
		group by pc.pack_category_id
		order by pc.pack_category_index`,
	);

	return { pack, categories: categories || [] };
}

async function getPackList(req: Request, res: Response) {
	try {
		const { userId } = req;
		const packList = await getAvailablePacks(userId);

		return res.status(200).json({ packList });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error getting your pack list.' });
	}
}

async function addNewPack(req: Request, res: Response) {
	const errorMessage = 'There was an error adding a new pack.';
	try {
		const { userId } = req;
		const newPack = await createNewPack(userId);

		const newPackError = isError(newPack);
		if (newPackError) return res.status(400).json({ error: errorMessage });

		const { pack, categories } = newPack;
		return res.status(200).json({ pack, categories });
	} catch (err) {
		return res.status(400).json({ error: errorMessage });
	}
}

async function createNewPack(userId: string) {
	try {
		const packIndex = await generateIndex(t.pack, 'pack_index', {
			user_id: userId,
		});

		const [pack] = await knex(t.pack)
			.insert({
				user_id: userId,
				pack_name: 'New Pack',
				pack_index: packIndex,
			})
			.returning('*');

		const categories = await knex(t.packCategory)
			.insert({
				user_id: userId,
				pack_id: pack.packId,
				pack_category_name: '',
				pack_category_index: 0,
				pack_category_color: 'primary',
			})
			.returning('*');

		const packItems = await knex(t.packItem)
			.insert({
				user_id: userId,
				pack_id: pack.packId,
				pack_category_id: categories[0].packCategoryId,
				pack_item_name: '',
				pack_item_index: 0,
			})
			.returning('*');

		categories[0].packItems = packItems;

		return { pack, categories };
	} catch (err) {
		return new Error('There was an error creating a new pack.');
	}
}

async function importNewPack(req: Request, res: Response) {
	const importErrorMessage = 'There was an error importing your pack.';
	try {
		const { userId } = req;
		const { pack_url } = req.body;
		const importedPack = await packScraper(pack_url);

		// handle error
		const isPackError = isError(importedPack);
		if (isPackError) return res.status(400).json({ error: importErrorMessage });

		// save new pack to db
		const { pack_name, pack_description, pack_categories } = importedPack;

		const packIndex = await generateIndex(t.pack, 'pack_index', {
			user_id: userId,
		});

		// insert pack
		const [{ packId }] = await knex(t.pack)
			.insert({
				user_id: userId,
				pack_name,
				pack_description,
				pack_index: packIndex,
			})
			.returning('pack_id');

		// insert categories and pack items
		pack_categories.map(async (category) => {
			const { pack_category_name, pack_category_index, pack_items } = category;
			// get theme color based on index
			const themeColor = await getThemeColor(userId, pack_category_index);

			// assign default color if theme color error
			const isThemeColorError = isError(themeColor);
			const pack_category_color = isThemeColorError ? 'primary' : themeColor;

			// insert pack category
			const [{ packCategoryId }] = await knex(t.packCategory)
				.insert({
					user_id: userId,
					pack_id: packId,
					pack_category_name,
					pack_category_index,
					pack_category_color,
				})
				.returning('pack_category_id');

			// insert pack items
			const packItemsWithIds = pack_items.map((item) => ({
				...item,
				user_id: userId,
				pack_id: packId,
				pack_category_id: packCategoryId,
			}));
			await knex(t.packItem).insert(packItemsWithIds);
		});

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: importErrorMessage });
	}
}

async function uploadPackPhoto(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		// @ts-expect-error: key value exists for File type
		const pack_photo_url = createCloudfrontUrlForPhoto(req.file?.key, 'packPhotoBucket');

		// check for previous pack photo url
		const { packPhotoUrl: prevUrl } = await knex(t.pack)
			.select('pack_photo_url')
			.where({ user_id: userId, pack_id: packId })
			.first();

		if (prevUrl) await s3DeletePhoto(prevUrl);

		await knex(t.pack)
			.update({ pack_photo_url })
			.where({ user_id: userId, pack_id: packId });

		return res.status(200).send();
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error uploading your pack photo.' });
	}
}

async function deletePackPhoto(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const { packPhotoUrl } = await knex(t.pack)
			.select('pack_photo_url')
			.where({ user_id: userId, pack_id: packId })
			.first();

		// delete from S3
		await s3DeletePhoto(packPhotoUrl);

		// delete from DB
		await knex(t.pack)
			.update({ pack_photo_url: '' })
			.where({ user_id: userId, pack_id: packId });

		return res.status(200).send();
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error uploading your pack photo.' });
	}
}

async function editPack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;
		const { modified_pack } = req.body;

		//remove non-essential properties for update
		delete modified_pack['user_id'];
		delete modified_pack['pack_id'];
		delete modified_pack['pack_index'];

		const [updatedPack] = await knex(t.pack)
			.update({ ...modified_pack })
			.where({ user_id: userId, pack_id: packId })
			.returning('*');

		return res.status(200).json({ updatedPack });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error editing your pack.' });
	}
}

async function movePack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;
		const { new_index, prev_index } = req.body;

		await changeItemOrder(userId, t.pack, 'pack_index', new_index, prev_index);

		await knex(t.pack)
			.update({ pack_index: new_index })
			.where({ user_id: userId, pack_id: packId });

		return res.status(200).json({ packId, newIndex: new_index });
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error changing your pack order.' });
	}
}

async function deletePack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const maxGearClosetIndex = await getMaxItemIndex(userId, null);
		// remove packId from packItems (keep in garage)
		// update indexes to start at highest index in gear closet
		await knex.raw(`
			update pack_item pk
			set pack_item_index = pk2.new_index + ${maxGearClosetIndex}, 
			pack_category_id = null, pack_id = null
				FROM (
					SELECT pk.pack_id, pk.pack_item_id, pk.pack_item_index, 
					row_number() over (order by pack_item_index) as new_index
					FROM pack_item pk
					WHERE user_id = '${userId}' AND pack_id = ${packId}
					ORDER BY pack_category_id
				) pk2
			where pk.pack_item_id = pk2.pack_item_id;`);

		await knex(t.packCategory).del().where({ user_id: userId, pack_id: packId });

		await knex(t.pack).del().where({ user_id: userId, pack_id: packId });

		// shift pack indexes
		await knex.raw(`UPDATE pack
			SET pack_index = pack_index - 1
			WHERE user_id = '${userId}' AND pack_index > 0`);

		//if no packs left, create default pack
		const response = await knex(t.pack)
			.select('pack_id')
			.where({ user_id: userId })
			.first();
		if (!response) await createNewPack(userId);

		return res.status(200).json({ deletedPackId: packId });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your pack.' });
	}
}

async function deletePackAndItems(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		await knex(t.packItem).del().where({ user_id: userId, pack_id: packId });

		await knex(t.packCategory).del().where({ user_id: userId, pack_id: packId });

		await knex(t.pack).del().where({ user_id: userId, pack_id: packId });

		// shift pack indexes
		await knex.raw(`UPDATE pack
			SET pack_index = pack_index - 1
			WHERE user_id = '${userId}' AND pack_index > 0`);

		//if no packs left, ensure user has default pack
		const response = await knex(t.pack)
			.select('pack_id')
			.where({ user_id: userId })
			.first();
		if (!response) await createNewPack(userId);

		return res.status(200).json({ deletedPackId: packId });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your pack.' });
	}
}

async function addPackItem(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { pack_id, pack_category_id } = req.body;

		const pack_item_index = await generateIndex(t.packItem, 'pack_item_index', {
			user_id: userId,
			pack_id,
			pack_category_id,
		});

		const [packItem] =
			(await knex(t.packItem)
				.insert({
					user_id: userId,
					pack_id,
					pack_category_id,
					pack_item_name: '',
					pack_item_index,
				})
				.returning('*')) || [];

		return res.status(200).json({ packItem });
	} catch (err) {
		res.status(400).json({ error: 'There was an error adding a new pack item.' });
	}
}

async function editPackItem(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		const [updatedItem = {}] = await knex(t.packItem)
			.update({ ...req.body })
			.where({ pack_item_id: packItemId, user_id: userId })
			.returning('*');

		return res.status(200).json(updatedItem);
	} catch (err) {
		return res.status(400).json({ error: 'There was an error saving your pack item.' });
	}
}

async function movePackItem(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		const {
			pack_category_id,
			pack_item_index,
			prev_pack_item_index,
			prev_pack_category_id,
		} = req.body;

		if (prev_pack_category_id === pack_category_id) {
			// higher position visually, making it a lower index in our table
			const higherPos = pack_item_index < prev_pack_item_index;
			// move pack item indexes to allow item at new position
			// handle lower or higher position for items in same category
			higherPos
				? await knex.raw(`UPDATE pack_item
				SET pack_item_index = pack_item_index + 1 
				WHERE pack_item_index >= ${pack_item_index} and pack_item_index < ${prev_pack_item_index}
				AND user_id = '${userId}' AND pack_category_id = ${pack_category_id}`)
				: // handle lower position
				  await knex.raw(`UPDATE pack_item 
				SET pack_item_index = pack_item_index - 1 
				WHERE pack_item_index <= ${pack_item_index} AND pack_item_index > ${prev_pack_item_index}
				AND user_id = '${userId}' AND pack_category_id = ${pack_category_id}`);
		} else {
			// when moving to different category, we don't have to worry about previous position
			await knex.raw(`UPDATE pack_item
				SET pack_item_index = pack_item_index + 1
				WHERE pack_item_index >= ${pack_item_index}
				AND user_id = '${userId}' AND pack_category_id = ${pack_category_id}`);
		}

		// update the pack items position now that we've made room
		await knex(t.packItem)
			.update({ pack_item_index, pack_category_id })
			.where({ user_id: userId, pack_item_id: packItemId });

		// if packItem is dragged into a new cateogry
		// move all items in previous category back an index since item is now gone
		if (prev_pack_category_id !== pack_category_id) {
			await shiftPackItems(userId, prev_pack_category_id, prev_pack_item_index);
		}

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error moving your pack item.' });
	}
}

async function moveItemToCloset(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		const maxGearClosetIndex = await getMaxItemIndex(userId, null);

		const { packItemIndex, packCategoryId } = await knex(t.packItem)
			.select('pack_item_index', 'pack_category_id')
			.where({ user_id: userId, pack_item_id: packItemId })
			.first();

		await knex(t.packItem)
			.update({
				pack_id: null,
				pack_category_id: null,
				pack_item_index: maxGearClosetIndex + 1,
			})
			.where({ user_id: userId, pack_item_id: packItemId });

		await shiftPackItems(userId, packCategoryId, packItemIndex);

		return res.status(200).send();
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error moving your item to your gear closet.' });
	}
}

async function deletePackItem(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		const [{ packCategoryId, packItemIndex }] = await knex(t.packItem)
			.delete()
			.where({ pack_item_id: packItemId })
			.returning(['pack_category_id', 'pack_item_index']);

		await shiftPackItems(userId, packCategoryId, packItemIndex);

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your pack item.' });
	}
}

async function addPackCategory(req: Request & { params: number }, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const packCategoryIndex = await generateIndex(t.packCategory, 'pack_category_index', {
			user_id: userId,
			pack_id: packId,
		});

		const themeColorName = await getThemeColor(userId, packCategoryIndex);

		const [packCategory] = await knex(t.packCategory)
			.insert({
				pack_category_name: '',
				user_id: userId,
				pack_id: packId,
				pack_category_index: packCategoryIndex,
				pack_category_color: themeColorName,
			})
			.returning('*');

		// add default pack item
		const [packItem] = await knex(t.packItem)
			.insert({
				user_id: userId,
				pack_id: packId,
				pack_category_id: packCategory.packCategoryId,
				pack_item_name: '',
				pack_item_index: 0,
			})
			.returning('*');

		packCategory.packItems = [packItem];

		return res.status(200).json({ packCategory });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error adding a new category.' });
	}
}

async function getThemeColor(user_id: string, packCategoryIndex: number) {
	try {
		//get user's theme ID from user_settings
		const { themeId } = await knex(t.userSettings)
			.select('theme_id')
			.where({ user_id })
			.first();

		// get nth number from theme_colors using pack category index
		const themeColorIndex = packCategoryIndex % themeColorNames.length;
		const { themeColorName } = await knex(t.themeColor)
			.select('theme_color_name')
			.where({ theme_id: themeId })
			.offset(themeColorIndex)
			.limit(1)
			.first();

		return themeColorName;
	} catch (err) {
		return new Error('There was an error getting the theme color.');
	}
}

async function editPackCategory(req: Request, res: Response) {
	try {
		const { userId, body } = req;
		const { categoryId } = req.params;

		await knex(t.packCategory)
			.update(body)
			.where({ user_id: userId, pack_category_id: categoryId });

		return res.status(200).send();
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error editing your pack category.' });
	}
}

async function movePackCategory(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { categoryId } = req.params;
		const { new_index, prev_index, pack_id } = req.body;

		await changeItemOrder(
			userId,
			t.packCategory,
			'pack_category_index',
			new_index,
			prev_index,
			`pack_id = ${pack_id}`,
		);

		await knex(t.packCategory)
			.update({ pack_category_index: new_index })
			.where({ user_id: userId, pack_category_id: categoryId });

		return res.status(200).send();
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error changing your pack order.' });
	}
}

async function moveCategoryToCloset(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { categoryId } = req.params;

		const maxGearClosetIndex = await getMaxItemIndex(userId, null);

		await knex.raw(`
			update pack_item pk
			set pack_item_index = pk2.new_index + ${maxGearClosetIndex}, 
			pack_category_id = null, pack_id = null
				FROM (
					SELECT pk.pack_id, pk.pack_item_id, pk.pack_item_index, 
					row_number() over (order by pack_item_index) as new_index
					FROM pack_item pk
					WHERE user_id = '${userId}' AND pack_category_id = ${categoryId}
					ORDER BY pack_item_index
				) pk2
			where pk.pack_item_id = pk2.pack_item_id;`);

		await deleteCategory(userId, categoryId);

		return res.status(200).json({ deletedId: categoryId });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your category. ' });
	}
}

async function deleteCategoryAndItems(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { categoryId } = req.params;

		await knex(t.packItem).del().where({ user_id: userId, pack_category_id: categoryId });

		await deleteCategory(userId, categoryId);

		return res.status(200).json({ deletedId: categoryId });
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error deleting your pack items.' });
	}
}

async function getAvailablePacks(userId: string) {
	try {
		return await knex.raw(
			`select 
			pack.pack_id, pack_name, pack_index,
			coalesce(array_remove(array_agg(to_jsonb(pc) order by pack_index), NULL), '{}') as pack_categories from pack
			left outer join pack_category pc on pc.pack_id = pack.pack_id	
		where pack.user_id = '${userId}'
		group by pack.pack_id
		order by pack.pack_index`,
		);
	} catch (err) {
		return new Error('Error getting available packs.');
	}
}

async function deleteCategory(user_id: string, pack_category_id: number | string) {
	const [{ packCategoryIndex, packId }] = await knex(t.packCategory)
		.del()
		.where({ user_id, pack_category_id })
		.returning(['pack_category_index', 'pack_id']);

	await knex.raw(`UPDATE pack_category
		SET pack_category_index = pack_category_index - 1
		WHERE pack_category_index >= ${packCategoryIndex}
		AND pack_id = ${packId}`);
}

export default {
	getDefaultPack,
	getPack,
	getPackList,
	addNewPack,
	importNewPack,
	uploadPackPhoto,
	editPack,
	movePack,
	deletePackPhoto,
	deletePack,
	deletePackAndItems,
	addPackItem,
	editPackItem,
	movePackItem,
	moveItemToCloset,
	deletePackItem,
	deleteCategoryAndItems,
	addPackCategory,
	editPackCategory,
	movePackCategory,
	moveCategoryToCloset,
};
