import express from "express";
import packController from "./packController.js";

const router = express.Router();

router.get("/", packController.getDefaultPack);
router.post("/pack-items", packController.addPackItem);
router.put("/pack-items/:packItemId", packController.editPackItem);
router.delete("/pack-items/:packItemId", packController.deletePackItem);
router.post("/categories/:packId", packController.addPackCategory);
router.put("/categories/:categoryId", packController.editPackCategory);
router.delete("/categories/:categoryId", packController.deletePackCategory);
router.delete(
  "/categories-items/:categoryId",
  packController.deleteCategoryAndItems
);

export default router;
