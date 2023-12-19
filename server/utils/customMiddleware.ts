const jwt = require("jsonwebtoken");
const knex = require("../db/connection");

async function getUserId(req, res, next) {
  //get token from cookies and verify jwt
  if (req.signedCookies["token"]) {
    const [token] = req.signedCookies;
    if (token) {
      const { userId } = await jwt.verify(token, process.env.APP_SECRET);
      req.userId = userId;
    }
  }
  //next
  next();
}

async function attachUserToRequest(req, res, next) {
  //don't attach user if not logged in
  if (!req.userId) return next();
  const user = await knex("users")
    .select("user_id", "name", "email")
    .where({ user_id: req.userId })
    .first();
}

async function protectedRoute(req, res, next) {
  if (!req.userId) {
    return res
      .status(400)
      .json({ error: "Please log in to complete this request." });
  }
  next();
}

module.exports = { getUserId, attachUserToRequest, protectedRoute };
