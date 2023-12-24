import express from "express";
const router = express.Router();
import userController from "./userController.js";

router.get("/", userController.getUser);

export default router;
