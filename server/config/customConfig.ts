const {
  getUserId,
  attachUserToRequest,
  changeCase,
} = require("../utils/customMiddleware");
import { Express } from "express";

function customConfig(app: Express) {
  app.use(getUserId);
  app.use(attachUserToRequest);
  app.use(changeCase);
}

module.exports = customConfig;
