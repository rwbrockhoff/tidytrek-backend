const express = require("express");
const cors = require("cors");
import { Express } from "express";

const mainConfig = (app: Express) => {
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(cors());
};

module.exports = mainConfig;
