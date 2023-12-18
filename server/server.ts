import express from "express";
import dotenv from "dotenv";
import mainConfig from "./config/mainConfig.js";
import routeConfig from "./config/routeConfig.js";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? "production.env" : "dev.env",
});
const app = express();
mainConfig(app);
routeConfig(app);

export default app;
