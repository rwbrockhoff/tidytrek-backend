import express from "express";
const router = express.Router();
const userController = require("./userController");

router.get("/", userController.getUser);

export default router;
