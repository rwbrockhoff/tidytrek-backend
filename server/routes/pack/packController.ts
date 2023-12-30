import knex from "../../db/connection.js";
// const { camelCase } = require("../../utils/utils");

async function getDefaultPack(req, res) {
  try {
    const { userId } = req;

    const { packId: defaultPackId } = await knex("packs")
      .select("pack_id")
      .where({ user_id: userId })
      .orderBy("created_at")
      .first();

    const { pack, categories } = await getPack(userId, defaultPackId);

    const packList = await knex("packs")
      .select(["pack_id", "pack_name"])
      .where({ user_id: userId });

    return res.status(200).json({ packList, pack, categories });
  } catch (err) {
    res
      .status(400)
      .json({ error: "We're having trouble loading your packs right now." });
  }
}

async function getPack(userId, packId) {
  const pack = await knex("packs")
    .where({ user_id: userId })
    .orderBy("created_at")
    .first();

  // Gets categories for a pack ordered by placement index
  // Groups all pack items for each category into an array property {pack_items: []}
  const [categories] = await knex.raw(
    `select array_agg(row_to_json(t)) as categories
  FROM (
  select pack_categories.pack_category_id, pack_categories.pack_category_name, 
  pack_categories.pack_category_description, pack_categories.pack_category_placement_index,
   array_agg(row_to_json(pack_items)) as pack_items from pack_items 
  left join pack_categories on pack_categories.pack_category_id = pack_items.pack_category_id
  where pack_categories.user_id = ${userId} 
  AND pack_categories.pack_id = ${packId}
  group by pack_items.pack_category_id, pack_categories.pack_category_id
  order by pack_categories.pack_category_placement_index
  ) t`
  );
  return { pack, categories: categories?.categories || [] };
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

async function deletePackItem(req, res) {
  try {
    const { packItemId } = req.params;
    const [deletedItemIds = {}] = await knex("pack_items")
      .delete()
      .where({ pack_item_id: packItemId })
      .returning(["pack_category_id", "pack_item_id"]);
    return res.status(200).json({ deletedItemIds });
  } catch (err) {
    console.log("ERR: ", err);
    return res
      .status(400)
      .json({ error: "There was an error deleting your pack item." });
  }
}

export default { getDefaultPack, editPackItem, deletePackItem };
