const environment = process.env.NODE_ENV;
import knex from "knex";
import initialConfig from "../../knexfile.js";
const config = initialConfig[environment];
export default knex(config);
