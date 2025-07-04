import knex from '../../db/connection.js';
import { Request, Response } from 'express';
import { Pack } from '../../types/packs/packTypes.js';
import { tables as t } from '../../../knexfile.js';
import { getUserSettings } from '../authentication/authenticationController.js';
import { getProfileAndPacks } from '../profile/profileController.js';
import { getUserProfileInfo } from '../profileSettings/profileSettingsController.js';

async function getPack(req: Request, res: Response) {
	try {
		const { packId } = req.params;

		const pack: Pack = await knex(t.pack)
			.where({ pack_id: packId, pack_public: true })
			.first();

		// Handle private and non-existent packs
		if (pack === undefined) {
			return res.status(200).json({
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

		const settings = await getUserSettings(pack.user_id);

		const { profileInfo, socialLinks } = await getUserProfileInfo(pack.user_id);

		const categories = await getCategories(packId);

		return res
			.status(200)
			.json({ pack, categories, settings, userProfile: { profileInfo, socialLinks } });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error getting this pack.' });
	}
}

async function addPackViewCount({ pack_id, pack_views }: Pack) {
	try {
		return await knex(t.pack)
			.update({ pack_views: pack_views + 1 })
			.where({ pack_id });
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

		const { public_profile } = await knex(t.userSettings)
			.select('public_profile')
			.where({ user_id: resolvedId })
			.first();

		// handle private profiles or non-existent users
		if (!public_profile) {
			return res.status(200).json({
				user: null,
				packs: [],
				settings: null,
			});
		}
		const isPackOwner = req.userId === resolvedId;
		const profile = await getProfileAndPacks(resolvedId, isPackOwner);
		const settings = await getUserSettings(resolvedId);

		return res.status(200).json({ ...profile, settings });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error loading the profile.' });
	}
}

async function getIdFromUsername(username: string) {
	const { user_id } = await knex(t.userProfile)
		.select('user_id')
		.where({ username })
		.first();
	return user_id;
}

export default { getPack, getUserProfile };
