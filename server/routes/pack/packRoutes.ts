import express from "express";
import packController from "./packController.js";

const router = express.Router();

router.get("/", packController.getDefaultPack);
router.get("/pack-list", packController.getPackList);
router.get("/:packId", packController.getPack);
router.post("/", packController.addNewPack);
router.put("/:packId", packController.editPack);
router.put("/index/:packId", packController.movePack);
router.delete("/:packId", packController.deletePack);
router.delete("/items/:packId", packController.deletePackAndItems);
router.post("/pack-items", packController.addPackItem);
router.put("/pack-items/:packItemId", packController.editPackItem);
router.put("/pack-items/index/:packItemId", packController.movePackItem);
router.delete("/pack-items/:packItemId", packController.deletePackItem);
router.post("/categories/:packId", packController.addPackCategory);
router.put("/categories/:categoryId", packController.editPackCategory);
router.delete("/categories/:categoryId", packController.deletePackCategory);
router.delete(
  "/categories/items/:categoryId",
  packController.deleteCategoryAndItems
);

export default router;
