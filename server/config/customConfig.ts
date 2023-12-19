const { getUserId, attachUserToRequest } = require("../utils/customMiddleware");
import { Express } from "express";

function customConfig(app: Express) {
  app.use(getUserId);
  app.use(attachUserToRequest);
}

module.exports = customConfig;
