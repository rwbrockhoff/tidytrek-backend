import express from "express";
const router = express.Router();
const userController = require("./userController");

router.get("/", userController.getUser);

module.exports = router;
