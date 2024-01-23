import knex from '../../db/connection.js';
import { Request, Response } from 'express';

async function getDefaultPack(req: Request, res: Response) {
	try {
		const { userId } = req;

		const { packId: defaultPackId } =
			(await knex('packs')
				.select('pack_id')
				.where({ user_id: userId })
				.orderBy('pack_index')
				.first()) || {};

		if (defaultPackId) {
			const { pack, categories } = await getPackById(userId, defaultPackId);

			return res.status(200).json({ pack, categories });
		} else {
			// UI can handle not having a default pack. However, this is just an extra layer of caution.
			// User should always have at least a default pack.
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

		const { pack, categories } = await getPackById(userId, packId);

		return res.status(200).json({ pack, categories });
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error loading your pack right now.' });
	}
}

async function getPackById(userId: number, packId: string) {
	const pack = await knex('packs')
		.where({ user_id: userId, pack_id: packId })
		.orderBy('created_at')
		.first();

	// Gets categories for a pack ordered by index
	// Groups all pack items for each category into an object {pack_items: []}
	const categories = await knex.raw(
		`select 
    pack_categories.pack_category_id, pack_categories.pack_id, pack_categories.pack_category_name, pack_categories.pack_category_color,
    array_agg(row_to_json(ordered_pack_items)) as pack_items from pack_categories
    left outer join
    (
      select * from pack_items where pack_items.user_id = ${userId} order by pack_items.pack_item_index
      
    ) ordered_pack_items on pack_categories.pack_category_id = ordered_pack_items.pack_category_id
    where pack_categories.user_id = ${userId} and pack_categories.pack_id = ${packId}
    group by pack_categories.pack_category_id
    order by pack_categories.pack_category_index`,
	);
	return { pack, categories: categories || [] };
}

async function getPackList(req: Request, res: Response) {
	try {
		const { userId } = req;
		const packList = await knex('packs')
			.select(['pack_id', 'pack_name'])
			.where({ user_id: userId })
			.orderBy('pack_index');

		return res.status(200).json({ packList });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error getting your pack list.' });
	}
}

async function addNewPack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const response = await createNewPack(userId);
		if ('pack' in response) {
			return res
				.status(200)
				.json({ pack: response['pack'], categories: response['categories'] });
		}
	} catch (err) {
		return res.status(400).json({ error: 'There was an error adding a new pack.' });
	}
}

async function createNewPack(userId: number) {
	try {
		const packIndex = await generateIndex('packs', 'pack_index', {
			user_id: userId,
		});

		const [pack] = await knex('packs')
			.insert({
				user_id: userId,
				pack_name: 'New Pack',
				pack_index: packIndex,
			})
			.returning('*');

		const categories = await knex('pack_categories')
			.insert({
				user_id: userId,
				pack_id: pack.packId,
				pack_category_name: 'Default Category',
				pack_category_index: 0,
			})
			.returning('*');

		const packItems = await knex('pack_items')
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

async function editPack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;
		const { modified_pack } = req.body;

		//remove non-essential properties for update
		delete modified_pack['user_id'];
		delete modified_pack['pack_id'];
		delete modified_pack['pack_index'];
		delete modified_pack['created_at'];
		delete modified_pack['updated_at'];

		const [updatedPack] = await knex('packs')
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
		const { new_index } = req.body;

		await knex.raw(`UPDATE packs 
    SET pack_index = pack_index + 1 
    WHERE pack_index >= ${new_index}
    AND user_id = ${userId}`);

		await knex('packs')
			.update({
				pack_index: new_index,
			})
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

		// unattach pack items (keep in garage)
		await knex('pack_items')
			.update({ pack_category_id: null, pack_id: null })
			.where({ pack_id: packId });

		await knex('pack_categories').del().where({ user_id: userId, pack_id: packId });

		await knex('packs').del().where({ user_id: userId, pack_id: packId });

		//if no packs left, create default pack
		const response = await knex('packs')
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

		await knex('pack_items').del().where({ user_id: userId, pack_id: packId });

		await knex('pack_categories').del().where({ user_id: userId, pack_id: packId });

		await knex('packs').del().where({ user_id: userId, pack_id: packId });

		//if no packs left, ensure user has default pack
		const response = await knex('packs')
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

		const packItemIndex = await generateIndex('pack_items', 'pack_item_index', {
			user_id: userId,
			pack_id,
			pack_category_id,
		});

		const [packItem] =
			(await knex('pack_items')
				.insert({
					user_id: userId,
					pack_id,
					pack_category_id,
					pack_item_name: '',
					pack_item_index: packItemIndex,
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

		const [updatedItem = {}] = await knex('pack_items')
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
			prev_pack_category_id,
			prev_pack_item_index,
		} = req.body;

		// move all items forward to make room for a packItem at new position
		// only move indexes that are greater than or equal
		await knex.raw(`UPDATE pack_items 
    SET pack_item_index = pack_item_index + 1 
    WHERE pack_item_index >= ${pack_item_index}
    AND pack_category_id = ${pack_category_id}`);

		await knex('pack_items')
			.update({
				pack_item_index,
				pack_category_id,
			})
			.where({ user_id: userId, pack_item_id: packItemId });

		// if packItem is dragged into a new cateogry
		// move all items in previous category back an index to account for
		// pack item "leaving" the category
		if (prev_pack_category_id !== pack_category_id) {
			await knex.raw(`UPDATE pack_items 
        SET pack_item_index = pack_item_index - 1 
        WHERE pack_item_index >= ${prev_pack_item_index}
        AND pack_category_id = ${prev_pack_category_id}`);
		}

		return res.status(200).json({
			packCategoryId: pack_category_id,
			packItemIndex: pack_item_index,
			prevPackCategoryId: prev_pack_category_id,
			prevPackItemIndex: prev_pack_item_index,
		});
	} catch (err) {
		return res.status(400).json({ error: 'There was an error moving your pack item.' });
	}
}

async function deletePackItem(req: Request, res: Response) {
	try {
		const { packItemId } = req.params;
		const [deletedItemIds = {}] = await knex('pack_items')
			.delete()
			.where({ pack_item_id: packItemId })
			.returning(['pack_category_id', 'pack_item_id']);
		return res.status(200).json({ deletedItemIds });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your pack item.' });
	}
}

async function addPackCategory(req: Request & { params: number }, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const packCategoryIndex = await generateIndex(
			'pack_categories',
			'pack_category_index',
			{ user_id: userId, pack_id: packId },
		);

		const [packCategory] = await knex('pack_categories')
			.insert({
				pack_category_name: 'Category',
				user_id: userId,
				pack_id: packId,
				pack_category_index: packCategoryIndex,
			})
			.returning('*');

		// add default pack item
		const [packItem] = await knex('pack_items')
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

async function editPackCategory(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { categoryId } = req.params;
		const { pack_category_name } = req.body;

		const [packCategory] = await knex('pack_categories')
			.update({ pack_category_name })
			.where({ user_id: userId, pack_category_id: categoryId })
			.returning('*');

		return res.status(200).json({ packCategory });
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error editing your pack category.' });
	}
}

async function deletePackCategory(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { categoryId } = req.params;

		await knex('pack_items')
			.update({ pack_category_id: null, pack_id: null })
			.where({ pack_category_id: categoryId });

		await knex('pack_categories')
			.del()
			.where({ user_id: userId, pack_category_id: categoryId });

		return res.status(200).json({ deletedId: categoryId });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your category. ' });
	}
}

async function deleteCategoryAndItems(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { categoryId } = req.params;

		await knex('pack_items')
			.del()
			.where({ user_id: userId, pack_category_id: categoryId });

		await knex('pack_categories')
			.del()
			.where({ user_id: userId, pack_category_id: categoryId });

		return res.status(200).json({ deletedId: categoryId });
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error deleting your pack items.' });
	}
}

// Generate a new index based on the current pack context
// used when we can't gurantee item created is the first item (0 index)
// cannot auto increment indexes in pg because this is used for ordering purposes

async function generateIndex(
	tableName: string,
	indexName: string,
	conditions: {
		user_id: number;
		pack_id?: number | string;
		pack_category_id?: number;
		pack_item_id?: number;
	},
): Promise<number> {
	const response = await knex(tableName)
		.select(knex.raw(`MAX(${indexName})`))
		.where(conditions)
		.first();
	if ('max' in response) {
		if (typeof response['max'] === 'number') return response['max'] + 1;
		else return 0;
	}
	return 0;
	// if (response['max'] === null) return 0;
	// else return response['max'] + 1;
}

export default {
	getDefaultPack,
	getPack,
	getPackList,
	addNewPack,
	editPack,
	movePack,
	deletePack,
	deletePackAndItems,
	addPackItem,
	editPackItem,
	movePackItem,
	deletePackItem,
	deleteCategoryAndItems,
	addPackCategory,
	editPackCategory,
	deletePackCategory,
};
