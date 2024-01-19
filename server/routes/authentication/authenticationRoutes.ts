import express from "express";
import authenticationController from "./authenticationController.js";

const router = express.Router();

router.get("/status", authenticationController.getAuthStatus);
router.post("/register", authenticationController.register);
router.post("/login", authenticationController.login);
router.post("/logout", authenticationController.logout);

export default router;
