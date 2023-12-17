import express from "express";
import mainConfig from "./config/mainConfig.js";

const app = express();
mainConfig(app);

export default app;
