import knex from "knex";
import config from "../../knexfile.js";

const environment: string = process.env.NODE_ENV;

const db = knex(config)[environment];

export default db;
