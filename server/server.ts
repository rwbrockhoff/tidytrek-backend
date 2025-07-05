import "./config/config.js"; //dotenv
import express from "express";

import mainConfig from "./config/mainConfig.js";
import routeConfig from "./config/routeConfig.js";
import customConfig from "./config/customConfig.js";

const app = express();
mainConfig(app);
customConfig(app); // custom middleware
routeConfig(app);

export default app;
