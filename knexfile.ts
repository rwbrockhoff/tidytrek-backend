import { knexCamelCaseResponse } from "./server/utils/utils.js";
const dbName = "tidytrek_db";

export default {
  development: {
    client: "pg",
    connection: {
      host: "127.0.0.1",
      port: 5432,
      database: dbName,
    },
    postProcessResponse: (result, queryContext) =>
      knexCamelCaseResponse(result),
    asyncStackTraces: true,
    migrations: {
      extension: "ts",
      directory: `${process.cwd()}/server/db/migrations`,
    },
    seeds: {
      extension: "ts",
      directory: `${process.cwd()}/server/db/seeds`,
    },
  },
  production: {
    client: "pg",
    connection: {
      host: process.env.PRODUCTION_DB_HOST,
      database: process.env.PRODUCTION_DB_NAME,
      port: 5432,
      user: process.env.PRODUCTION_DB_USER,
      password: process.env.PRODUCTION_DB_PASSWORD,
      ssl: true,
    },
    postProcessResponse: (result, queryContext) =>
      knexCamelCaseResponse(result),
    migrations: {
      extension: "ts",
      directory: `${process.cwd()}/server/db/migrations`,
    },
  },
  test: {
    client: "pg",
    connection: {
      host: "127.0.0.1",
      port: 5432,
      database: `${dbName}_test`,
    },
    postProcessResponse: (result, queryContext) =>
      knexCamelCaseResponse(result),
    asyncStackTraces: true,
    migrations: {
      extension: "js",
      directory: `${process.cwd()}/dist/server/db/migrations`,
    },
    seeds: {
      extension: "js",
      directory: `${process.cwd()}/dist/server/db/seeds`,
    },
  },
};
