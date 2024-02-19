import knex from '../../db/connection.js';
import { tables as t } from '../../../knexfile.js';
import { Request, Response } from 'express';

async function getProfileSettings(req: Request, res: Response) {
	try {
		const { userId } = req;
		const profileSettings =
			(await knex(t.userProfile).where({ user_id: userId }).first()) || {};

		return res.status(200).json({ profileSettings });
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error getting your profile settings.' });
	}
}

export default { getProfileSettings };
