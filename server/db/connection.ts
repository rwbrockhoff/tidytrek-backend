import knex from 'knex';
import initialConfig from '../../knexfile.js';
import { validateEnvironment } from '../config/environment.js';

const env = validateEnvironment();
const config = initialConfig[env.NODE_ENV];
export default knex(config);
