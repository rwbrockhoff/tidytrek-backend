const environment = process.env.NODE_ENV;
import knex from 'knex';
import initialConfig from '../../knexfile.js';
// @ts-expect-error ENV coming from script
const config = initialConfig[environment];
export default knex(config);
