import knex from '../db/connection.js';
import { Tables } from '../db/tables.js';

export const getUserSettingsData = async (userId: string) => {
	return await knex(Tables.UserSettings)
		.select('public_profile', 'palette', 'dark_mode', 'weight_unit', 'currency_unit')
		.where({ user_id: userId })
		.first();
};