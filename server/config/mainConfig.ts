import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Express } from "express";
import { acceptedOrigins, corsErrorMessage } from "./configurationVariables.js";

const mainConfig = (app: Express) => {
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(
    cors({
      credentials: true,
      origin: (origin, cb) => {
        //testing
        if (!origin) return cb(null, true);

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

export default mainConfig;
