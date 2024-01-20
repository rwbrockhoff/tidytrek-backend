import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import knex from "../../db/connection.js";

const cookieOptions = {
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 180,
  signed: true,
};

async function register(req, res) {
  try {
    const { email, password, name } = req.body;

    const existingEmail = await knex("users")
      .select("email")
      .where({ email })
      .first();

    if (existingEmail)
      return res
        .status(409)
        .json({ error: "Email is alredy registered. Please log in." });

    const hash = await bcrypt.hash(password, 10);

    const [user] = await knex("users").insert({ email, name, password: hash }, [
      "user_id",
      "name",
      "email",
    ]);

    // add jwt + signed cookie
    const token = createWebToken(user.userId);
    res.cookie("token", token, cookieOptions);

    await createDefaultPack(user.userId);

    // just an extra precaution, password should never exist on user object in register fn()
    if (user.password) delete user.password;
    res.status(200).json({ user });
  } catch (err) {
    res.status(400).json({ error: err });
  }
}

async function login(req, res) {
  const errorText = "Invaid login information.";
  try {
    const { email, password } = req.body;

    if (!email && !password) return res.status(400).json({ error: errorText });

    const user = await knex("users").where({ email }).first();

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (passwordsMatch) {
      // create token + cookie
      const token = createWebToken(user.userId);
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
    res.status(400).json({ error: err });
  }
}

async function logout(req, res) {
  return res.status(200).clearCookie("token").json({
    message: "User has been logged out.",
  });
}

async function getAuthStatus(req, res) {
  try {
    if (req.user && req.userId) {
      res.status(200).json({ isAuthenticated: true, user: req.user });
    } else {
      res.status(200).json({
        isAuthenticated: req.userId !== undefined,
        info: { user: req.user, id: req.userId },
      });
    }
  } catch (err) {
    res
      .status(400)
      .json({ error: "There was an error checking your log in status." });
  }
}

function createWebToken(userId) {
  return jwt.sign({ userId }, process.env.APP_SECRET);
}

async function createDefaultPack(userId) {
  try {
    const [{ packId }] = await knex("packs")
      .insert({
        user_id: userId,
        pack_name: "Default Pack",
        pack_index: 0,
      })
      .returning("pack_id");

    const [{ packCategoryId }] = await knex("pack_categories")
      .insert({
        user_id: userId,
        pack_id: packId,
        pack_category_name: "Default Category",
        pack_category_index: 0,
      })
      .returning("pack_category_id");

    await knex("pack_items").insert({
      user_id: userId,
      pack_id: packId,
      pack_category_id: packCategoryId,
      pack_item_name: "",
      pack_item_index: 0,
    });
  } catch (err) {
    return new Error("Error creating default pack for user");
  }
}

export default { register, login, logout, getAuthStatus };
