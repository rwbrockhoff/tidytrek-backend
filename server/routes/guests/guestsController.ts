import knex from '../../db/connection.js';
import { Request, Response } from 'express';
import { Pack } from '../../types/packs/packTypes.js';
import { tables as t } from '../../../knexfile.js';
import { getUserSettings } from '../authentication/authenticationController.js';

async function getPack(req: Request, res: Response) {
	try {
		const { packId } = req.params;

		const pack: Pack = await knex(t.pack)
			.where({ pack_id: packId, pack_public: true })
			.orderBy('created_at')
			.first();

		const settings = await getUserSettings(pack.userId);

		if (pack === undefined) {
			return res
				.status(400)
				.json({ error: "This is either a private pack or it doesn't exist." });
		}

		if (req.userId && req.userId !== pack.userId) await addPackViewCount(pack);
		if (!req.userId) await addPackViewCount(pack);

		const categories = await getCategories(packId);

		return res.status(200).json({ pack, categories, settings });
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
            pc.*, array_remove(array_agg(to_jsonb(ordered_pack_items)), NULL) as pack_items from pack_category pc
                left outer join
                ( select * from pack_item where pack_item.pack_id = ${packId} 
                order by pack_item.pack_item_index
                ) ordered_pack_items on pc.pack_category_id = ordered_pack_items.pack_category_id
            where pc.pack_id = ${packId}
            group by pc.pack_category_id
            order by pc.pack_category_index`,
	);
}

export default { getPack };
