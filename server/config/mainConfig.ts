const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
import { Express } from "express";
const {
  acceptedOrigins,
  corsErrorMessage,
} = require("./configurationVariables");

const mainConfig = (app: Express) => {
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(
    cors({
      credentials: true,
      origin: (origin, cb) => {
        //testing
        if (!origin) return cb(null, true);
        //return error for origins we don't recognize
        if (!acceptedOrigins.includes(origin)) {
          return cb(new Error(corsErrorMessage), true);
        }
        //return true if accepted origin
        return cb(null, true);
      },
    })
  );
  app.use(cookieParser(process.env.COOKIE_SECRET));
};

module.exports = mainConfig;
