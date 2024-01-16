import jwt from "jsonwebtoken";
import knex from "../db/connection.js";
import snakeCaseKeys from "snakecase-keys";

export const getUserId = async (req, res, next) => {
  // get token from signedCookies and verify jwt
  const token = req.signedCookies?.token;
  if (token) {
    const { userId } = await jwt.verify(token, process.env.APP_SECRET);
    req.userId = userId;
  }
  next();
};

export const attachUserToRequest = async (req, res, next) => {
  //don't attach user if not logged in
  if (!req.userId) return next();

  const user = await knex("users")
    .select("user_id", "name", "email")
    .where({ user_id: req.userId })
    .first();

  if (user) {
    //no pass is returned from query, just added layer of caution
    delete user.password;
    if (!user.password) {
      req.user = user;
    }
  }
  next();
};

export const protectedRoute = async (req, res, next) => {
  //middleware used for routes only accessible to logged in users
  if (!req.userId) {
    return res
      .status(400)
      .json({ error: "Please log in to complete this request." });
  }
  next();
};

export const changeCase = (req, res, next) => {
  if (req.body) {
    let snakeCaseBody = snakeCaseKeys(req.body);
    req.body = snakeCaseBody;
  }
  next();
};
