import knex from 'knex';
import initialConfig from '../../knexfile.js';
import { validateEnvironment } from '../config/environment.js';
import './database-types.js'; // Import to register the type augmentation

const env = validateEnvironment();
const config = initialConfig[env.NODE_ENV];
const db = knex(config);

export default db;
