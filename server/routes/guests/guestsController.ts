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

		if (pack === undefined) {
			return res
				.status(400)
				.json({ error: "This is either a private pack or it doesn't exist." });
		}

		if (req.userId && req.userId !== pack.userId) await addPackViewCount(pack);
		if (!req.userId) await addPackViewCount(pack);

		const settings = await getUserSettings(pack.userId);

		const { profileInfo, socialLinks } = await getUserProfileInfo(pack.userId);

		const categories = await getCategories(packId);

		return res
			.status(200)
			.json({ pack, categories, settings, userProfile: { profileInfo, socialLinks } });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error getting this pack.' });
	}
}

async function addPackViewCount(pack: Pack) {
	try {
		const { packId, packViews } = pack;
		return await knex(t.pack)
			.update({ pack_views: packViews + 1 })
			.where({ pack_id: packId });
	} catch (err) {
		return new Error('Error adding to view count.');
	}
}

async function getCategories(packId: string) {
	// Gets categories for a pack ordered by index
	// Groups all pack items for each category into an object {pack_items: []}
	return await knex.raw(
		`select 
			pc.*, 
			coalesce(array_remove(array_agg(to_jsonb(pi) order by pack_item_index::NUMERIC), NULL), '{}') as pack_items 
			from pack_category pc
			left outer join pack_item pi on pi.pack_category_id = pc.pack_category_id	
		where pc.pack_id = ?
		group by pc.pack_category_id
		order by pc.pack_category_index::NUMERIC`,
		[packId]
	);
}

async function getUserProfile(req: Request, res: Response) {
	try {
		const { username } = req.params;
		const resolvedId = await getIdFromUsername(username);

		const { publicProfile } = await knex(t.userSettings)
			.select('public_profile')
			.where({ user_id: resolvedId })
			.first();

		// handle private profiles or non-existent users
		if (!publicProfile) {
			return res
				.status(400)
				.json({ error: "The user doesn't exist or doesn't have a public profile." });
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
	const { userId } = await knex(t.userProfile)
		.select('user_id')
		.where({ username })
		.first();
	return userId;
}

export default { getPack, getUserProfile };
