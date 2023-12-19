const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
import { Express } from "express";

const mainConfig = (app: Express) => {
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(cors());
  app.use(cookieParser(process.env.COOKIE_SECRET));
};

module.exports = mainConfig;
