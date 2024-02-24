import knex from '../../db/connection.js';
import { Request, Response } from 'express';
import { tables as t } from '../../../knexfile.js';
import { getUserProfileInfo } from '../profileSettings/profileSettingsController.js';

async function getProfile(req: Request, res: Response) {
	try {
		const { userId } = req;

		const profile = await getProfileAndPacks(userId, true);

		return res.status(200).json(profile);
	} catch (err) {
		return res.status(400).json({ error: 'There was an error loading your profile.' });
	}
}

export const getProfileAndPacks = async (userId: number, isPackOwner: boolean) => {
	const { profileSettings, socialLinks, user } = await getUserProfileInfo(userId);

	const packThumbnailList = await getPackThumbnailList(userId, isPackOwner);
	return { userProfile: { profileSettings, socialLinks, user }, packThumbnailList };
};

export const getPackThumbnailList = async (userId: number, isPackOwner: boolean) => {
	const publicCondition = isPackOwner ? {} : { pack_public: true };
	return await knex(t.pack)
		.where({ user_id: userId, ...publicCondition })
		.orderBy('pack_index');
};

export default { getProfile };
