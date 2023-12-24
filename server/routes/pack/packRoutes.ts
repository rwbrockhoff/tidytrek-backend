import express from "express";
import packController from "./packController.js";

const router = express.Router();

router.get("/", packController.getPacks);

export default router;
