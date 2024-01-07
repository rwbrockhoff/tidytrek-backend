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
    pack_categories.pack_category_id, pack_categories.pack_id, pack_categories.pack_category_name, pack_categories.pack_category_color,
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

async function editPack(req, res) {
  try {
    const { userId } = req;
    const { packId } = req.params;
    const { modified_pack } = req.body;

    //remove non-essential properties for update
    delete modified_pack["user_id"];
    delete modified_pack["pack_id"];
    delete modified_pack["pack_index"];
    delete modified_pack["created_at"];
    delete modified_pack["updated_at"];

    const [updatedPack] = await knex("packs")
      .update({ ...modified_pack })
      .where({ user_id: userId, pack_id: packId })
      .returning("*");

    return res.status(200).json({ updatedPack });
  } catch (err) {
    return res
      .status(400)
      .json({ error: "There was an error editing your pack." });
  }
}

async function addPackItem(req, res) {
  try {
    const { userId } = req;
    const { pack_id, pack_category_id } = req.body;

    // determine highest current index value for pack
    const { max: currentIndexMax } =
      (await knex("pack_items")
        .select(knex.raw(`MAX(pack_item_index)`))
        .where({ user_id: userId, pack_id, pack_category_id })
        .first()) || {};

    const [packItem] =
      (await knex("pack_items")
        .insert({
          user_id: userId,
          pack_id,
          pack_category_id,
          pack_item_name: "",
          pack_item_index: currentIndexMax + 1,
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
    const { userId } = req;
    const { packItemId } = req.params;

    const [updatedItem = {}] = await knex("pack_items")
      .update({ ...req.body })
      .where({ pack_item_id: packItemId, user_id: userId })
      .returning("*");

    return res.status(200).json(updatedItem);
  } catch (err) {
    return res
      .status(400)
      .json({ error: "There was an error saving your pack item." });
  }
}

async function movePackItem(req, res) {
  try {
    const { userId } = req;
    const { packItemId } = req.params;
    const {
      pack_category_id,
      pack_item_index,
      prev_pack_category_id,
      prev_pack_item_index,
    } = req.body;

    // move all items forward to make room for packItem at new position
    // only move indexes that are greater than or equal
    await knex.raw(`UPDATE pack_items 
    SET pack_item_index = pack_item_index + 1 
    WHERE pack_item_index >= ${pack_item_index}
    AND pack_category_id = ${pack_category_id}`);

    await knex("pack_items")
      .update({
        pack_item_index,
        pack_category_id,
      })
      .where({ user_id: userId, pack_item_id: packItemId });

    // if packItem is dragged into a new cateogry
    // move all items in previous category back an index to account for
    // pack item "leaving" the category
    if (prev_pack_category_id !== pack_category_id) {
      await knex.raw(`UPDATE pack_items 
        SET pack_item_index = pack_item_index - 1 
        WHERE pack_item_index >= ${prev_pack_item_index}
        AND pack_category_id = ${prev_pack_category_id}`);
    }

    return res.status(200).json({
      packCategoryId: pack_category_id,
      packItemIndex: pack_item_index,
      prevPackCategoryId: prev_pack_category_id,
      prevPackItemIndex: prev_pack_item_index,
    });
  } catch (err) {
    return res
      .status(400)
      .json({ error: "There was an error moving your pack item." });
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
        pack_item_index: 0,
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
      .update({ pack_category_id: null, pack_id: null })
      .where({ pack_category_id: categoryId });

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

async function deleteCategoryAndItems(req, res) {
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
      .json({ error: "There was an error deleting your pack items." });
  }
}

export default {
  getDefaultPack,
  editPack,
  addPackItem,
  editPackItem,
  movePackItem,
  deletePackItem,
  deleteCategoryAndItems,
  addPackCategory,
  editPackCategory,
  deletePackCategory,
};
