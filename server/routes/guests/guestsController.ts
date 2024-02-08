import knex from '../../db/connection.js';
import { Request, Response } from 'express';
import { Pack } from '../../types/packs/packTypes.js';

async function getPack(req: Request, res: Response) {
	try {
		const { packId } = req.params;

		const pack: Pack = await knex('packs')
			.where({ pack_id: packId, pack_public: true })
			.orderBy('created_at')
			.first();

		if (pack === undefined) {
			return res
				.status(400)
				.json({ error: "This is either a private pack or it doesn't exist." });
		}

		if (req.userId && req.userId !== pack.userId) await addPackViewCount(pack);
		if (!req.userId) await addPackViewCount(pack);

		const categories = (await getCategories(packId)) || [];

		return res.status(200).json({ pack, categories });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error getting this pack.' });
	}
}

async function addPackViewCount(pack: Pack) {
	try {
		const { packId, packViews } = pack;
		await knex('packs')
			.update({ pack_views: packViews + 1 })
			.where({ pack_id: packId });
	} catch (err) {
		return new Error('Error adding to view count.');
	}
}

async function getCategories(packId: string) {
	try {
		// Gets categories for a pack ordered by index
		// Groups all pack items for each category into an object {pack_items: []}
		return await knex.raw(
			`select 
            pc.*, array_agg(row_to_json(ordered_pack_items)) as pack_items from pack_categories pc
                left outer join
                ( select * from pack_items where pack_items.pack_id = ${packId} 
                order by pack_items.pack_item_index
                ) ordered_pack_items on pc.pack_category_id = ordered_pack_items.pack_category_id
            where pc.pack_id = ${packId}
            group by pc.pack_category_id
            order by pc.pack_category_index`,
		);
	} catch (err) {
		return new Error('There was an error getting the pack categories.');
	}
}

export default { getPack };
