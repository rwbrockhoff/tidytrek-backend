import knex from '@/db/connection.js';
import { Request, Response } from 'express';
import { tables as t } from '@/../knexfile.js';
import { getUserProfileInfo } from '@/routes/profileSettings/profileSettingsController.js';

async function getProfile(req: Request, res: Response) {
	try {
		const { userId } = req;

		const profile = await getProfileAndPacks(userId, true);

		return res.status(200).json(profile);
	} catch (err) {
		return res.status(400).json({ error: 'There was an error loading your profile.' });
	}
}

export const getProfileAndPacks = async (userId: string, isPackOwner: boolean) => {
	const { profileInfo, socialLinks } = await getUserProfileInfo(userId);

	const packThumbnailList = await getPackThumbnailList(userId, isPackOwner);
	return { userProfile: { profileInfo, socialLinks }, packThumbnailList };
};

export const getPackThumbnailList = async (userId: string, isPackOwner: boolean) => {
	const publicCondition = isPackOwner ? {} : { pack_public: true };
	return await knex(t.pack)
		.where({ user_id: userId, ...publicCondition })
		.orderByRaw('pack_index::NUMERIC');
};

export default { getProfile };
