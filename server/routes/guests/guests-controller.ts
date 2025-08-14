import knex from '../../db/connection.js';
import { Request, Response } from 'express';
import { Tables } from '../../db/tables.js';
import { getUserSettingsData } from '../../services/user-service.js';
import {
	getProfileAndPacks,
	getUserProfileInfo,
} from '../../services/profile-service.js';
import { logError } from '../../config/logger.js';
import { successResponse, notFound, internalError } from '../../utils/error-response.js';

async function getPack(req: Request, res: Response) {
	try {
		const { packId } = req.params;

		const pack = await knex(Tables.Pack)
			.where('pack_id', packId)
			.where('pack_public', true)
			.first();

		// Handle private and non-existent packs
		if (pack === undefined) {
			return successResponse(res, {
				pack: null,
				categories: [],
				settings: null,
				userProfile: null,
			});
		}

		// Add count for other user
		if (req.userId && req.userId !== pack.user_id) await addPackViewCount(pack);

		// Add count for public non-user view
		if (!req.userId) await addPackViewCount(pack);

		const settings = await getUserSettingsData(pack.user_id);

		const { profileInfo, socialLinks } = await getUserProfileInfo(pack.user_id);

		const categories = await getCategories(packId);

		return successResponse(res, {
			pack,
			categories,
			settings,
			userProfile: { profileInfo, socialLinks },
		});
	} catch (err) {
		logError('Get guest view of pack failed', err, {
			packId: req.params?.packId,
			userId: req?.userId,
		});
		return internalError(res, 'There was an error getting this pack.');
	}
}

async function addPackViewCount({ pack_id, pack_views }: { pack_id: number; pack_views: number }) {
	try {
		return await knex(Tables.Pack)
			.update({ pack_views: pack_views + 1 })
			.where('pack_id', pack_id);
	} catch (err) {
		return new Error('Error adding to view count.');
	}
}

async function getCategories(packId: string) {
	// Gets categories for a pack ordered by index
	// Groups all pack items for each category into an object {pack_items: []}
	const { rows: categories = [] } = await knex.raw(
		`select 
			pc.*, 
			coalesce(array_remove(array_agg(to_jsonb(pi) order by pack_item_index::NUMERIC), NULL), '{}') as pack_items 
			from pack_category pc
			left outer join pack_item pi on pi.pack_category_id = pc.pack_category_id	
		where pc.pack_id = ?
		group by pc.pack_category_id
		order by pc.pack_category_index::NUMERIC`,
		[packId],
	);
	return categories;
}

async function getUserProfile(req: Request, res: Response) {
	try {
		const { username } = req.params;
		const resolvedId = await getIdFromUsername(username);

		// User doesn't exist
		if (!resolvedId) return notFound(res, 'User not found.');

		const userSettings = await knex(Tables.UserSettings)
			.select('public_profile')
			.where('user_id', resolvedId)
			.first();
			
		const public_profile = userSettings?.public_profile;

		// User exists but profile is private
		if (!public_profile) {
			return successResponse(res, {
				userProfile: null,
				packThumbnailList: [],
				settings: null,
			});
		}
		const isPackOwner = req.userId === resolvedId;
		const profile = await getProfileAndPacks(resolvedId, isPackOwner);
		const settings = await getUserSettingsData(resolvedId);

		return successResponse(res, { ...profile, settings });
	} catch (err) {
		logError('Get guest view of user profile failed', err, {
			username: req.params?.username,
			userId: req?.userId,
		});
		return internalError(res, 'There was an error loading the profile.');
	}
}

async function getIdFromUsername(username: string) {
	const result = await knex(Tables.UserProfile).select('user_id').where('username', username).first();
	return result?.user_id;
}

export default { getPack, getUserProfile };
