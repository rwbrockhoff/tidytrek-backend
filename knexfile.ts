import { knexCamelCaseResponse } from "./server/utils/utils.js";
import "ts-node/register";
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
      extension: "ts",
      directory: `${process.cwd()}/server/db/migrations`,
    },
  },
};
