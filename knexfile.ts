import path from "path";
require("ts-node/register");
const dbName = "tidytrek_db";

module.exports = {
  development: {
    client: "pg",
    connection: {
      host: "127.0.0.1",
      port: 5432,
      database: dbName,
    },
    asyncStackTraces: true,
    migrations: {
      extension: "ts",
      directory: path.join(__dirname, "server/db/migrations"),
    },
  },
  production: {
    client: "pg",
    connection: {
      host: process.env.PRODUCTION_DB_HOST,
      database: dbName,
      port: 5432,
      user: process.env.PRODUCTION_DB_USER,
      password: process.env.PRODUCTION_DB_PASSWORD,
      ssl: true,
    },
    migrations: {
      extension: "ts",
      directory: path.join(__dirname, "server/db/migrations"),
    },
  },
};
