import knex from '../../db/connection.js';
import { Request, Response } from 'express';

async function getGearCloset(req: Request, res: Response) {
	try {
		const { userId } = req;

		const gearClosetList = await knex('pack_items').where({
			user_id: userId,
			pack_id: null,
		});
		const availablePacks = await knex('packs').where({ user_id: userId });

		return res.status(200).json({ gearClosetList, availablePacks });
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error accessing your gear closet.' });
	}
}

export default {
	getGearCloset,
};
