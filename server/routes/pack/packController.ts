import knex from '../../db/connection.js';
import { tables as t } from '../../../knexfile.js';
import { DEFAULT_PALETTE_COLOR } from '../../utils/constants.js';
import { Request, Response } from 'express';
import { createCloudfrontUrlForPhoto, s3DeletePhoto } from '../../utils/s3.js';
import { packScraper } from '../../utils/puppeteer.js';
import { isError } from '../../utils/utils.js';
import {
	DEFAULT_INCREMENT,
	getNextAppendIndex,
	moveWithFractionalIndex,
	bulkMoveToGearCloset,
} from '../../utils/fractionalIndexing.js';
import logger from '../../config/logger.js';
import { createErrorLogData } from '../../utils/loggerUtils.js';

async function getDefaultPack(req: Request, res: Response) {
	try {
		const { userId } = req;

		const { pack_id: defaultPackId } =
			(await knex(t.pack)
				.select('pack_id')
				.where({ user_id: userId })
				.orderByRaw('pack_index::NUMERIC')
				.first()) || {};

		if (defaultPackId) {
			const { pack, categories } = await getPackById(userId, defaultPackId);

			return res.status(200).json({ pack, categories });
		} else {
			// UI can handle not having a default pack.
			return res.status(200).send();
		}
	} catch (err) {
		logger.error(
			'Failed to load default pack',
			createErrorLogData(err, {
				userId: req.userId,
			}),
		);
		res.status(400).json({ error: "We're having trouble loading your packs right now." });
	}
}

async function getPack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const { pack, categories } = await getPackById(userId, Number(packId));

		if (!pack) {
			return res.status(404).json({ error: 'Pack not found.' });
		}

		return res.status(200).json({ pack, categories });
	} catch (err) {
		logger.error(
			'Failed to load pack',
			createErrorLogData(err, {
				userId: req.userId,
				packId: req.params.packId,
			}),
		);
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
	const { rows: categories = [] } = await knex.raw(
		`select 
			pc.*, 
			coalesce(array_remove(array_agg(to_jsonb(pi) order by pack_item_index::NUMERIC), NULL), '{}') as pack_items 
			from pack_category pc
			left outer join pack_item pi on pi.pack_category_id = pc.pack_category_id	
		where pc.user_id = ? and pc.pack_id = ?
		group by pc.pack_category_id
		order by pc.pack_category_index::NUMERIC`,
		[userId, packId],
	);

	return { pack: pack || null, categories };
}

async function getPackList(req: Request, res: Response) {
	try {
		const { userId } = req;
		const packList = await getAvailablePacks(userId);

		return res.status(200).json({ packList });
	} catch (err) {
		logger.error(
			'Failed to load pack list',
			createErrorLogData(err, {
				userId: req.userId,
			}),
		);
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

		logger.info('Pack created successfully', {
			userId: req.userId,
			packId: pack.pack_id,
			packName: pack.pack_name,
			timestamp: new Date(),
		});

		return res.status(200).json({ pack, categories });
	} catch (err) {
		logger.error(
			'Failed to create new pack',
			createErrorLogData(err, {
				userId: req.userId,
			}),
		);
		return res.status(400).json({ error: errorMessage });
	}
}

async function createNewPack(userId: string) {
	try {
		// Calculate index for new pack (append to end of user's pack list)
		const packIndex = await getNextAppendIndex(t.pack, 'pack_index', {
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
				pack_id: pack.pack_id,
				pack_category_name: '',
				pack_category_index: DEFAULT_INCREMENT.toString(),
				pack_category_color: DEFAULT_PALETTE_COLOR,
			})
			.returning('*');

		const packItems = await knex(t.packItem)
			.insert({
				user_id: userId,
				pack_id: pack.pack_id,
				pack_category_id: categories[0].pack_category_id,
				pack_item_name: '',
				pack_item_index: DEFAULT_INCREMENT.toString(),
			})
			.returning('*');

		categories[0].pack_items = packItems;

		return { pack, categories };
	} catch (err) {
		return new Error('There was an error creating a new pack.');
	}
}

async function importNewPack(req: Request, res: Response) {
	const importErrorMessage = 'There was an error importing your pack.';
	try {
		const { userId } = req;
		const { pack_url, palette_list } = req.body;
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
			return res.status(400).json({ error: importErrorMessage });
		}

		// save new pack to db
		const { pack_name, pack_description, pack_categories } = importedPack;

		// Calculate index for new imported pack (append to end of user's pack list)
		const packIndex = await getNextAppendIndex(t.pack, 'pack_index', {
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
			const themeColor = palette_list?.[pack_category_index % palette_list.length];

			// assign default color if theme color error
			const pack_category_color = isError(themeColor)
				? DEFAULT_PALETTE_COLOR
				: themeColor;

			// insert pack category
			const [{ pack_category_id }] = await knex(t.packCategory)
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
				pack_category_id,
			}));
			await knex(t.packItem).insert(packItemsWithIds);
		});

		logger.info('User imported external pack successfully', {
			userId,
			packUrl: pack_url,
		});

		return res.status(200).send();
	} catch (err) {
		logger.error(
			"Import user's external pack failed",
			createErrorLogData(err, {
				userId: req.body?.user_id,
				packUrl: req.body?.pack_url,
			}),
		);
		return res.status(400).json({ error: importErrorMessage });
	}
}

async function uploadPackPhoto(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		// @ts-expect-error: key value exists for File type
		const newPackPhotoUrl = createCloudfrontUrlForPhoto(req.file?.key, 'packPhotoBucket');

		// check for previous pack photo url
		const { pack_photo_url: prevPackPhotoUrl } = await knex(t.pack)
			.select('pack_photo_url')
			.where({ user_id: userId, pack_id: packId })
			.first();

		// Delete previous pack photo from S3
		if (prevPackPhotoUrl) await s3DeletePhoto(prevPackPhotoUrl);

		// Update pack with new S3 URL
		await knex(t.pack)
			.update({ pack_photo_url: newPackPhotoUrl })
			.where({ user_id: userId, pack_id: packId });

		return res.status(200).send();
	} catch (err) {
		logger.error(
			'Upload pack photo failed',
			createErrorLogData(err, {
				userId: req.body?.user_id,
				packId: req.params?.packId,
				// @ts-expect-error: key value exists for File type
				file: req.file?.key,
			}),
		);
		return res
			.status(400)
			.json({ error: 'There was an error uploading your pack photo.' });
	}
}

async function deletePackPhoto(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const { pack_photo_url } = await knex(t.pack)
			.select('pack_photo_url')
			.where({ user_id: userId, pack_id: packId })
			.first();

		// Delete from S3
		await s3DeletePhoto(pack_photo_url);

		// Delete from DB
		await knex(t.pack)
			.update({ pack_photo_url: null })
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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { _user_id, _pack_id, _pack_index, ...modified_pack } = req.body;

		const [updatedPack] = await knex(t.pack)
			.update({ ...modified_pack })
			.where({ user_id: userId, pack_id: packId })
			.returning('*');

		if (!updatedPack) {
			return res.status(404).json({ error: 'Pack not found.' });
		}

		return res.status(200).json(updatedPack);
	} catch (err) {
		return res.status(400).json({ error: 'There was an error editing your pack.' });
	}
}

async function movePack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;
		const { prev_pack_index, next_pack_index } = req.body;

		const { newIndex, rebalanced } = await moveWithFractionalIndex(
			t.pack,
			'pack_index',
			'pack_id',
			packId,
			prev_pack_index,
			next_pack_index,
			{ user_id: userId }, // WHERE conditions
		);

		return res.status(200).json({
			packId,
			newIndex,
			rebalanced,
			message: 'Pack moved successfully',
		});
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

		// Get all items from the pack to move to gear closet
		const packItems = await knex(t.packItem)
			.select(`${t.packItem}.*`)
			.join(
				t.packCategory,
				`${t.packItem}.pack_category_id`,
				`${t.packCategory}.pack_category_id`,
			)
			.where({ [`${t.packItem}.user_id`]: userId, [`${t.packItem}.pack_id`]: packId })
			.orderByRaw(
				`${t.packCategory}.pack_category_index::NUMERIC, ${t.packItem}.pack_item_index::NUMERIC`,
			);

		await bulkMoveToGearCloset(packItems, userId);

		// DELETE ON CASCADE: pack -> pack_category -> pack_item
		await knex(t.pack).del().where({ user_id: userId, pack_id: packId });

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

		// DELETE ON CASCADE: pack -> pack_category -> pack_item
		await knex(t.pack).del().where({ user_id: userId, pack_id: packId });

		// if no packs left, ensure user has default pack
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

		// Calculate index for new item
		const pack_item_index = await getNextAppendIndex(t.packItem, 'pack_item_index', {
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

		const { pack_category_id, prev_pack_category_id, prev_item_index, next_item_index } =
			req.body;

		const { newIndex, rebalanced } = await moveWithFractionalIndex(
			t.packItem,
			'pack_item_index',
			'pack_item_id',
			packItemId,
			prev_item_index,
			next_item_index,
			{ user_id: userId, pack_category_id: prev_pack_category_id }, // WHERE conditions - use PREVIOUS category to find the item
			{ pack_category_id }, // Additional fields to update (can change category on drag/drop)
		);

		return res.status(200).json({
			newIndex,
			rebalanced,
			categoryChanged: prev_pack_category_id !== pack_category_id,
			message: 'Pack item moved successfully',
		});
	} catch (err) {
		logger.error(
			'Move pack item failed',
			createErrorLogData(err, {
				userId: req.body?.user_id,
				operation: 'drag_drop_reorder',
				body: req.body,
			}),
		);
		return res.status(400).json({ error: 'There was an error moving your pack item.' });
	}
}

async function moveItemToCloset(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		// Calculate index for item moving to gear closet
		const newGearClosetIndex = await getNextAppendIndex(t.packItem, 'pack_item_index', {
			user_id: userId,
			pack_id: null,
			pack_category_id: null,
		});

		await knex(t.packItem)
			.update({
				pack_id: null,
				pack_category_id: null,
				pack_item_index: newGearClosetIndex,
			})
			.where({ user_id: userId, pack_item_id: packItemId });

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

		await knex(t.packItem).delete().where({ user_id: userId, pack_item_id: packItemId });

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your pack item.' });
	}
}

async function addPackCategory(req: Request & { params: number }, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;
		const { category_color } = req.body;

		// Calculate index for new category
		const packCategoryIndex = await getNextAppendIndex(
			t.packCategory,
			'pack_category_index',
			{ user_id: userId, pack_id: packId },
		);

		const [packCategory] = await knex(t.packCategory)
			.insert({
				pack_category_name: '',
				user_id: userId,
				pack_id: packId,
				pack_category_index: packCategoryIndex,
				pack_category_color: category_color,
			})
			.returning('*');

		// add default pack item (can be default index for first item)
		const [packItem] = await knex(t.packItem)
			.insert({
				user_id: userId,
				pack_id: packId,
				pack_category_id: packCategory.pack_category_id,
				pack_item_name: '',
				pack_item_index: DEFAULT_INCREMENT.toString(),
			})
			.returning('*');

		packCategory.pack_items = [packItem];

		return res.status(200).json({ packCategory });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error adding a new category.' });
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
		const { prev_category_index, next_category_index } = req.body;

		const { newIndex, rebalanced } = await moveWithFractionalIndex(
			t.packCategory,
			'pack_category_index',
			'pack_category_id',
			categoryId,
			prev_category_index,
			next_category_index,
			{ user_id: userId }, // WHERE conditions
		);

		return res.status(200).json({
			newIndex,
			rebalanced,
			message: 'Pack category moved successfully',
		});
	} catch (err) {
		logger.error(
			'Move pack category failed',
			createErrorLogData(err, {
				userId: req.body?.user_id,
				operation: 'drag_drop_reorder',
				body: req.body,
			}),
		);
		return res
			.status(400)
			.json({ error: 'There was an error changing your pack order.' });
	}
}

async function moveCategoryToCloset(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { categoryId } = req.params;

		// Get all items from the category to move to gear closet
		const categoryItems = await knex(t.packItem)
			.select('*')
			.where({ user_id: userId, pack_category_id: categoryId })
			.orderByRaw('pack_item_index::NUMERIC');

		// Bulk move all category items to gear closet
		await bulkMoveToGearCloset(categoryItems, userId);

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
		const { rows = [] } = await knex.raw(
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
		return new Error('Error getting available packs.');
	}
}

async function deleteCategory(user_id: string, pack_category_id: number | string) {
	try {
		// Delete ON CASCADE: pack_category -> pack_item
		await knex(t.packCategory).del().where({ user_id, pack_category_id });
	} catch (err) {
		throw new Error('Failed to delete category');
	}
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
