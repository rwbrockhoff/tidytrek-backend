import knex from '../../db/connection.js';
import { changeItemOrder, generateIndex } from '../pack/packUtils.js';
import { Request, Response } from 'express';

async function getGearCloset(req: Request, res: Response) {
	try {
		const { userId } = req;

		const gearClosetList = await knex('pack_items')
			.where({
				user_id: userId,
				pack_id: null,
			})
			.orderBy('pack_item_index');
		const availablePacks = await getAvailablePacks(userId);

		return res.status(200).json({ gearClosetList, availablePacks });
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error accessing your gear closet.' });
	}
}

async function addGearClosetItem(req: Request, res: Response) {
	try {
		const { userId } = req;

		const pack_item_index = await generateIndex('pack_items', 'pack_item_index', {
			user_id: userId,
			pack_id: null,
		});

		await knex('pack_items').insert({
			user_id: userId,
			pack_item_name: '',
			pack_item_index,
		});

		return res.status(200).send();
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error adding your item to your gear closet.' });
	}
}

async function editGearClosetItem(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		await knex('pack_items')
			.update({ ...req.body })
			.where({ pack_item_id: packItemId, user_id: userId });

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error editing your item.' });
	}
}

async function moveGearClosetItem(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;
		const { new_index, previous_index } = req.body;

		await changeItemOrder(
			userId,
			'pack_items',
			'pack_item_index',
			new_index,
			previous_index,
		);

		await knex('pack_items')
			.update({ pack_item_index: new_index })
			.where({ pack_item_id: packItemId, user_id: userId });

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error editing your item.' });
	}
}

async function moveItemToPack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;
		const { pack_id, pack_category_id } = req.body;

		const pack_item_index = await generateIndex('pack_items', 'pack_item_index', {
			user_id: userId,
			pack_id,
			pack_category_id,
		});

		await knex('pack_items')
			.update({ pack_id, pack_category_id, pack_item_index })
			.where({ user_id: userId, pack_item_id: packItemId });

		return res.status(200).send();
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error moving your item to a pack.' });
	}
}
async function deleteGearClosetItem(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		await knex('pack_items')
			.delete()
			.where({ pack_item_id: packItemId, user_id: userId });

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your item.' });
	}
}

async function getAvailablePacks(userId: number) {
	return await knex.raw(`select pack_name, packs.user_id, packs.pack_id, 
	array_agg(row_to_json(cat)) as available_categories from packs 
		left outer join 
		( select * from pack_categories 
		where user_id = ${userId} order by pack_category_index ) 
		cat on cat.pack_id = packs.pack_id
		where packs.user_id = ${userId}
		group by pack_name, packs.pack_id
		order by packs.pack_index;`);
}

export default {
	getGearCloset,
	addGearClosetItem,
	editGearClosetItem,
	moveGearClosetItem,
	moveItemToPack,
	deleteGearClosetItem,
};