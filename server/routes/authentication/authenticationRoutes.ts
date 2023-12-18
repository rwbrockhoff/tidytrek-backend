const express = require("express");
const authenticationController = require("./authenticationController");

const router = express.Router();

router.post("/register", authenticationController.register);
router.post("/login", authenticationController.login);
router.post("/logout", authenticationController.logout);

module.exports = router;
