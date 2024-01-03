import knex from "../../db/connection.js";

async function getDefaultPack(req, res) {
  try {
    const { userId } = req;

    const { packId: defaultPackId } =
      (await knex("packs")
        .select("pack_id")
        .where({ user_id: userId })
        .orderBy("pack_index")
        .first()) || {};

    if (defaultPackId) {
      const { pack, categories } = await getPack(userId, defaultPackId);

      const packList = await knex("packs")
        .select(["pack_id", "pack_name"])
        .where({ user_id: userId });

      return res.status(200).json({ packList, pack, categories });
    } else {
      return res.status(200).send();
    }
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

  // Gets categories for a pack ordered by index
  // Groups all pack items for each category into an array property {pack_items: []}
  const categories = await knex.raw(
    `select 
    pack_categories.pack_category_id, pack_categories.pack_id, pack_categories.pack_category_name, pack_categories.pack_category_description,
    array_agg(row_to_json(ordered_pack_items)) as pack_items from pack_categories
    left outer join
    (
      select * from pack_items where pack_items.user_id = ${userId} order by pack_items.pack_item_index
      
    ) ordered_pack_items on pack_categories.pack_category_id = ordered_pack_items.pack_category_id
    where pack_categories.user_id = ${userId} and pack_categories.pack_id = ${packId}
    group by pack_categories.pack_category_id
    order by pack_categories.pack_category_index`
  );
  return { pack, categories: categories || [] };
}

async function addPackItem(req, res) {
  try {
    const { userId } = req;
    const { pack_id, pack_category_id } = req.body;
    const [packItem] =
      (await knex("pack_items")
        .insert({
          user_id: userId,
          pack_id,
          pack_category_id,
          pack_item_name: "",
        })
        .returning("*")) || [];
    return res.status(200).json({ packItem });
  } catch (err) {
    res
      .status(400)
      .json({ error: "There was an error adding a new pack item." });
  }
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
    return res
      .status(400)
      .json({ error: "There was an error deleting your pack item." });
  }
}

async function addPackCategory(req, res) {
  try {
    const { userId } = req;
    const { packId } = req.params;

    const [packCategory] = await knex("pack_categories")
      .insert({
        pack_category_name: "Category",
        user_id: userId,
        pack_id: packId,
      })
      .returning("*");

    // add default pack item
    const [packItem] = await knex("pack_items")
      .insert({
        user_id: userId,
        pack_id: packId,
        pack_category_id: packCategory.packCategoryId,
        pack_item_name: "",
      })
      .returning("*");
    packCategory.packItems = [packItem];

    return res.status(200).json({ packCategory });
  } catch (err) {
    return res
      .status(400)
      .json({ error: "There was an error adding a new category." });
  }
}

async function editPackCategory(req, res) {
  try {
    const { userId } = req;
    const { categoryId } = req.params;
    const { pack_category_name } = req.body;

    const [packCategory] = await knex("pack_categories")
      .update({ pack_category_name })
      .where({ user_id: userId, pack_category_id: categoryId })
      .returning("*");

    return res.status(200).json({ packCategory });
  } catch (err) {
    return res
      .status(400)
      .json({ error: "There was an error editing your pack category." });
  }
}

async function deletePackCategory(req, res) {
  try {
    const { userId } = req;
    const { categoryId } = req.params;

    await knex("pack_items")
      .del()
      .where({ user_id: userId, pack_category_id: categoryId });

    await knex("pack_categories")
      .del()
      .where({ user_id: userId, pack_category_id: categoryId });

    return res.status(200).json({ deletedId: categoryId });
  } catch (err) {
    return res
      .status(400)
      .json({ error: "There was an error deleting your category. " });
  }
}

export default {
  getDefaultPack,
  addPackItem,
  editPackItem,
  deletePackItem,
  addPackCategory,
  editPackCategory,
  deletePackCategory,
};
