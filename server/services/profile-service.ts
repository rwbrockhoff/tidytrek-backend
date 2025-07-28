import knex from '../db/connection.js';
import { Tables } from '../db/tables.js';

export const getUserProfileInfo = async (userId: string) => {
	const profileInfo = await knex(Tables.User)
		.leftJoin(Tables.UserProfile, `${Tables.User}.user_id`, `${Tables.UserProfile}.user_id`)
		.select(
			'first_name',
			'trail_name',
			'username',
			'profile_photo_url',
			'banner_photo_url',
			'user_bio',
			'user_location',
		)
		.where({ [`${Tables.User}.user_id`]: userId })
		.first();

	const socialLinks = await knex(Tables.SocialLink)
		.select('social_link_id', 'social_link_url')
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
	return await knex(Tables.Pack)
		.where({ user_id: userId, ...publicCondition })
		.orderByRaw('pack_index::NUMERIC');
};
