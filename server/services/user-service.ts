import knex from '../db/connection.js';
import { tables as t } from '../../knexfile.js';

export const getUserSettingsData = async (userId: string) => {
	return await knex(t.userSettings)
		.select('public_profile', 'palette', 'dark_mode', 'weight_unit', 'currency_unit')
		.where({ user_id: userId })
		.first();
};