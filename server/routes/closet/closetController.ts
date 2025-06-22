import knex from '../../db/connection.js';
import { tables as t } from '../../../knexfile.js';
import { Request, Response } from 'express';
import {
	getNextAppendIndex,
	moveWithFractionalIndex,
} from '../../utils/fractionalIndexing.js';

async function getGearCloset(req: Request, res: Response) {
	try {
		const { userId } = req;

		// todo: int parser for pg to resolve knex queries returning string values
		// or convert raw queries to string values
		// current result: knex query: '45.0000' knex raw query: 45

		const [{ gearClosetList }] =
			(await knex.raw(
				`
			select coalesce(array_remove(array_agg(to_jsonb(pi) order by pack_item_index::NUMERIC), NULL), '{}') as gear_closet_list 
				from (
					select * from pack_item
					where user_id = ? and pack_id IS NULL
				) pi
		`,
				[userId],
			)) || [];

		return res.status(200).json({ gearClosetList });
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error accessing your gear closet.' });
	}
}

async function addGearClosetItem(req: Request, res: Response) {
	try {
		const { userId } = req;

		// Calculate index for new gear closet item (append to end)
		const pack_item_index = await getNextAppendIndex(t.packItem, 'pack_item_index', {
			user_id: userId,
			pack_id: null,
			pack_category_id: null,
		});

		await knex(t.packItem).insert({
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

		await knex(t.packItem)
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
		const { prev_item_index, next_item_index } = req.body;

		const { newIndex, rebalanced } = await moveWithFractionalIndex(
			t.packItem,
			'pack_item_index',
			'pack_item_id',
			packItemId,
			prev_item_index,
			next_item_index,
			{ user_id: userId, pack_id: null, pack_category_id: null }, // WHERE conditions for gear closet
		);

		return res.status(200).json({
			newIndex,
			rebalanced,
			message: 'Gear closet item moved successfully',
		});
	} catch (err) {
		return res.status(400).json({ error: 'There was an error editing your item.' });
	}
}

async function moveItemToPack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;
		const { pack_id, pack_category_id } = req.body;

		// Calculate index for item moving to pack (append to end of category)
		const newPackItemIndex = await getNextAppendIndex(t.packItem, 'pack_item_index', {
			user_id: userId,
			pack_id,
			pack_category_id,
		});

		await knex(t.packItem)
			.update({ pack_id, pack_category_id, pack_item_index: newPackItemIndex })
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

		await knex(t.packItem).delete().where({ pack_item_id: packItemId, user_id: userId });

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your item.' });
	}
}

export default {
	getGearCloset,
	addGearClosetItem,
	editGearClosetItem,
	moveGearClosetItem,
	moveItemToPack,
	deleteGearClosetItem,
};
