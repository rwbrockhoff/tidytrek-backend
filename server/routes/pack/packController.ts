import knex from "../../db/connection.js";
// const { camelCase } = require("../../utils/utils");

async function getPacks(req, res) {
  const { userId } = req;
  const userPacks =
    await knex.raw(`select packs.pack_id, packs.pack_name, packs.pack_description, packs.pack_public,
    packs.pack_affiliate, packs.pack_affiliate_description, packs.pack_location_tag, packs.pack_duration_tag,
    packs.pack_season_tag, packs.pack_url,
    
    (
      select array_agg(row_to_json(t)) as items_in_categories 
    FROM (
    select pack_categories.pack_category_id, pack_categories.pack_category_name, pack_categories.pack_category_description, 
    pack_categories.pack_category_placement_index, pack_categories.pack_id,
     array_agg(row_to_json(pack_items)) as items from pack_items 
    left join pack_categories on pack_categories.pack_category_id = pack_items.pack_category_id
    where pack_categories.pack_id = pack_items.pack_id and packs.pack_id = pack_items.pack_id
    group by pack_items.pack_category_id, pack_categories.pack_category_id
    ) t
    ) categories
    
    from packs
    left join pack_categories on packs.pack_id = pack_categories.pack_id
    left join pack_items on packs.pack_id = pack_items.pack_id
    where packs.user_id = ${userId}
    group by packs.pack_id`);

  return res.status(200).json(userPacks);
}

async function editPackItem(req, res) {
  try {
    const { packItemId } = req.params;

    const [updatedItem = {}] = await knex("pack_items")
      .update({ ...req.body })
      .where({ pack_item_id: packItemId })
      .returning("*");

    return res.status(200).json(updatedItem);
  } catch (err) {
    return res
      .status(400)
      .json({ error: "There was an error saving your pack item." });
  }
}

export default { getPacks, editPackItem };
