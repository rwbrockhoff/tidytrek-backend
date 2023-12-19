const express = require("express");
require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? "production.env" : "dev.env",
});
const mainConfig = require("./config/mainConfig");
const routeConfig = require("./config/routeConfig");
const customConfig = require("./config/customConfig");

const app = express();
mainConfig(app);
customConfig(app); // custom middleware
routeConfig(app);

module.exports = app;
