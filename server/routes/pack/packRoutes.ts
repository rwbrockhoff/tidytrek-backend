import express from "express";
import packController from "./packController.js";

const router = express.Router();

router.get("/", packController.getDefaultPack);
router.post("/pack/item", packController.addPackItem);
router.put("/pack/item/:packItemId", packController.editPackItem);
router.delete("/pack/item/:packItemId", packController.deletePackItem);
router.post("/pack/:packId/category", packController.addPackCategory);
router.put("/pack/category/:categoryId", packController.editPackCategory);

export default router;
