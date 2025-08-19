import { Knex } from 'knex';
import { Tables } from '../tables.js';
import { DEFAULT_PALETTE } from '../../utils/constants.js';
import { e2eTestUser } from '../test/test-data.js';

export async function seed(knex: Knex): Promise<void> {
	// Delete user - cascade delete
	await knex(Tables.User).where('user_id', e2eTestUser.userId).del();

	await knex(Tables.User).insert({
		user_id: e2eTestUser.userId,
		first_name: e2eTestUser.first_name,
		last_name: e2eTestUser.last_name,
		email: e2eTestUser.email,
	});

	await knex(Tables.UserProfile).insert({
		user_id: e2eTestUser.userId,
		trail_name: e2eTestUser.trailName,
		username: e2eTestUser.username,
	});

	await knex(Tables.UserSettings).insert({
		user_id: e2eTestUser.userId,
		palette: DEFAULT_PALETTE,
		dark_mode: false,
		public_profile: true,
		weight_unit: 'metric',
		currency_unit: 'USD',
	});

	await knex(Tables.SocialLink).insert([
		{
			user_id: e2eTestUser.userId,
			social_link_url: 'https://tidythruhiker.com',
		},
		{
			user_id: e2eTestUser.userId,
			social_link_url: 'https://twitter.com/testhiker',
		},
	]);
}
