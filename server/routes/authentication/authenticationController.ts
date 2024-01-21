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
    const { email, password, name, username } = req.body;

    const { unique, message } = await isUniqueAccount(email, username);

    if (!unique) return res.status(409).json({ error: message });

    const hash = await bcrypt.hash(password, 10);

    const [user] = await knex("users").insert(
      { email, name, password: hash, username: username || null },
      ["user_id", "name", "email", "username"]
    );

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

    if (user === undefined)
      return res
        .status(400)
        .json({ error: "No account found. Feel free to sign up." });

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
    res.status(400).json({ error: errorText });
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
      res.status(200).json({ isAuthenticated: req.userId !== undefined });
    }
  } catch (err) {
    res
      .status(400)
      .json({ error: "There was an error checking your log in status." });
  }
}

async function resetPassword(req, res) {
  try {
    const { email } = req.body;
    const [user] = await knex("users").select("email").where({ email });

    if (!user) {
      return res.status(400).json({
        error: "We could not verify your account information at this time.",
      });
    }
    return res.status(200).send();
  } catch (err) {
    res
      .status(400)
      .json({ error: "There was an error reseting your password." });
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

async function isUniqueAccount(email, username) {
  const existingEmail = await knex("users")
    .select("email")
    .where({ email })
    .first();

  if (existingEmail) {
    return {
      unique: false,
      message: "Account is already registered. Please log in.",
    };
  }

  if (username && username.length) {
    const existingUsername = await knex("users")
      .select("username")
      .where({ username })
      .first();

    if (existingUsername)
      return {
        unique: false,
        message: "That username is already taken. Good choice but try again!",
      };
  }
  return { unique: true };
}

export default { register, login, logout, getAuthStatus, resetPassword };
