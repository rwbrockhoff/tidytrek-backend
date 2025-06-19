import { Knex } from 'knex';
import { mockUser } from '../mock/mockData.js';
import { DEFAULT_THEME_NAME } from '../../utils/constants.js';
import { tables as t } from '../../../knexfile.js';

const { email, trailName, username } = mockUser;

export async function seed(knex: Knex): Promise<void> {
	await knex(t.userProfile).del();
	await knex(t.userSettings).del();

	// create user settings
	const { userId } = await knex(t.user).select('user_id').where({ email }).first();

	await knex(t.userProfile).insert({
		user_id: userId,
		trail_name: trailName,
		username,
	});

	// create default user settings
	await knex(t.userSettings).insert({ 
		user_id: userId, 
		theme_name: DEFAULT_THEME_NAME,
		dark_mode: false,
		public_profile: true,
		weight_unit: 'lb',
		currency_unit: 'USD'
	});
}
