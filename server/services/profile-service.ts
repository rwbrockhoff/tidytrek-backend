import knex from '../db/connection.js';
import { tables as t } from '../../knexfile.js';

export const getUserProfileInfo = async (userId: string) => {
	const profileInfo = await knex(t.user)
		.leftJoin(t.userProfile, `${t.user}.user_id`, `${t.userProfile}.user_id`)
		.select(
			'first_name',
			'trail_name',
			'username',
			'profile_photo_url',
			'banner_photo_url',
			'user_bio',
			'user_location',
		)
		.where({ [`${t.user}.user_id`]: userId })
		.first();

	const socialLinks = await knex(t.socialLink)
		.select('social_link_id', 'platform_name', 'social_link_url')
		.where({ user_id: userId });

	return { profileInfo, socialLinks };
};

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