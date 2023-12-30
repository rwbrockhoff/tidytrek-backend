import express from "express";
import packController from "./packController.js";

const router = express.Router();

router.get("/", packController.getDefaultPack);
router.put("/pack/item/:packItemId", packController.editPackItem);

export default router;
