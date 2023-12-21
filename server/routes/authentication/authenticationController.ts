const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const knex = require("../../db/connection");

const cookieOptions = {
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 180,
  signed: true,
};

async function register(req, res) {
  try {
    // validate incoming data
    const { email, password, name } = req.body;
    // check if email is already in use
    const existingEmail = await knex("users")
      .select("email")
      .where({ email })
      .first();
    if (existingEmail)
      return res
        .status(409)
        .json({ error: "Email is alredy registered. Please log in." });
    // bcrypt
    const hash = await bcrypt.hash(password, 10);
    // create new user
    const [user] = await knex("users").insert({ email, name, password: hash }, [
      "user_id",
      "name",
      "email",
    ]);
    // add jwt + signed cookie
    const token = createWebToken(user.user_id);
    res.cookie("token", token, cookieOptions);
    // send back user (double check no password attached)
    if (user.password) delete user.password;
    res.status(200).json({ user });
  } catch (err) {
    res.status(400).json({ error: "Error registering account." });
  }
}

async function login(req, res) {
  const errorText = "Invaid login information.";
  try {
    // get info off body
    const { email, password } = req.body;

    if (!email && !password) return res.status(400).json({ error: errorText });
    // get user from db
    const user = await knex("users").where({ email }).first();
    // passwords match
    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (passwordsMatch) {
      // create token + cookie
      const token = createWebToken(user.user_id);
      res.cookie("token", token, cookieOptions);
      // send back user, no password attached
      if (user.password) delete user.password;
      if (!user.password) {
        res.status(200).json({ user });
      } else {
        res.status(400).json({ error: errorText });
      }
    } else return res.status(400).json({ error: errorText });
  } catch (err) {
    res.status(400).json({ error: "Error logging in." });
  }
}

async function logout(req, res) {
  return res.status(200).clearCookie("token").json({
    message: "User has been logged out.",
  });
}

async function getAuthStatus(req, res) {
  if (req.user && req.userId) {
    res.status(200).json({ isAuthenticated: true, user: req.user });
  } else {
    res.status(200).json({ isAuthenticated: req.userId !== undefined });
  }
}

function createWebToken(userId) {
  return jwt.sign({ userId }, process.env.APP_SECRET);
}

module.exports = { register, login, logout, getAuthStatus };
