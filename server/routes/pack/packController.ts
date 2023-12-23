const knex = require("../../db/connection");

async function getPacks(req, res) {
  const { userId } = req;
  const { rows: packResults } =
    await knex.raw(`select packs.pack_id, packs.pack_name, packs.pack_description, packs.pack_public,
  packs.pack_affiliate, packs.pack_affiliate_description, packs.pack_location_tag, packs.pack_duration_tag,
  packs.pack_season_tag, packs.pack_url,
  
  (
    select array_agg(row_to_json(t)) as items_in_categories 
  FROM (
  select pack_categories.pack_category_id, pack_categories.pack_category_name, pack_categories.pack_category_description, pack_categories.pack_category_placement_index,
   array_agg(row_to_json(pack_items)) as items from pack_items 
  left join pack_categories on pack_categories.pack_category_id = pack_items.pack_category_id
  group by pack_items.pack_category_id, pack_categories.pack_category_id
  ) t
  ) items
  
  from packs
  left join pack_categories on packs.pack_id = pack_categories.pack_id
  left join pack_items on packs.pack_id = pack_items.pack_id
  where packs.user_id = ${userId}
  group by packs.pack_id`);
  return res.status(200).json(packResults);
}

module.exports = { getPacks };
