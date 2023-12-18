import express from "express";
import dotenv from "dotenv";
import mainConfig from "./config/mainConfig.js";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? "production.env" : "dev.env",
});
const app = express();
mainConfig(app);

export default app;
