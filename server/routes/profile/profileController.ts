import knex from '../../db/connection.js';
import { Request, Response } from 'express';
import { tables as t } from '../../../knexfile.js';
import { getUserProfileInfo } from '../profileSettings/profileSettingsController.js';

async function getProfile(req: Request, res: Response) {
	try {
		const { userId } = req;

		const { profileSettings, socialLinks, user } = await getUserProfileInfo(userId);

		const packThumbnailList = await getPackThumbnailList(userId);

		return res
			.status(200)
			.json({ userProfile: { profileSettings, socialLinks, user }, packThumbnailList });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error loading your profile.' });
	}
}

async function getPackThumbnailList(userId: number) {
	return await knex(t.pack).where({ user_id: userId }).orderBy('pack_index');
}

export default { getProfile };
