const express = require("express");
const packController = require("./packController");

const router = express.Router();

router.get("/", packController.getPacks);

module.exports = router;
