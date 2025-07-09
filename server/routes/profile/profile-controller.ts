import knex from '../../db/connection.js';
import { Request, Response } from 'express';
import { tables as t } from '../../../knexfile.js';
import { getProfileAndPacks } from '../../services/profile-service.js';

async function getProfile(req: Request, res: Response) {
	try {
		const { userId } = req;

		const profile = await getProfileAndPacks(userId, true);

		return res.status(200).json(profile);
	} catch (err) {
		return res.status(400).json({ error: 'There was an error loading your profile.' });
	}
}

export const getPackThumbnailList = async (userId: string, isPackOwner: boolean) => {
	const publicCondition = isPackOwner ? {} : { pack_public: true };
	return await knex(t.pack)
		.where({ user_id: userId, ...publicCondition })
		.orderByRaw('pack_index::NUMERIC');
};

export default { getProfile };
