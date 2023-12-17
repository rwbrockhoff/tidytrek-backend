import express from "express";
import cors from "cors";
import { Express } from "express";

const mainConfig = (app: Express) => {
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(cors());
};

export default mainConfig;
