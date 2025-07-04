import { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';
import { DEFAULT_PALETTE } from '../../utils/constants.js';
import { e2eTestUser } from '../test/testData.js';

export async function seed(knex: Knex): Promise<void> {
	// Clean up existing test user data
	await knex(t.packItem).where('user_id', e2eTestUser.userId).del();
	await knex(t.packCategory).where('user_id', e2eTestUser.userId).del();
	await knex(t.pack).where('user_id', e2eTestUser.userId).del();
	await knex(t.socialLink).where('user_id', e2eTestUser.userId).del();
	await knex(t.userProfile).where('user_id', e2eTestUser.userId).del();
	await knex(t.userSettings).where('user_id', e2eTestUser.userId).del();
	await knex(t.user).where('user_id', e2eTestUser.userId).del();

	await knex(t.user).insert({
		user_id: e2eTestUser.userId,
		first_name: e2eTestUser.first_name,
		last_name: e2eTestUser.last_name,
		email: e2eTestUser.email,
	});

	await knex(t.userProfile).insert({
		user_id: e2eTestUser.userId,
		trail_name: e2eTestUser.trailName,
		username: e2eTestUser.username,
	});

	await knex(t.userSettings).insert({
		user_id: e2eTestUser.userId,
		palette: DEFAULT_PALETTE,
		dark_mode: false,
		public_profile: true,
		weight_unit: 'lb',
		currency_unit: 'USD',
	});

	await knex(t.socialLink).insert([
		{
			user_id: e2eTestUser.userId,
			platform_name: 'Custom',
			social_link_url: 'https://tidythruhiker.com',
		},
		{
			user_id: e2eTestUser.userId,
			platform_name: 'Twitter',
			social_link_url: 'https://twitter.com/testhiker',
		},
	]);

	console.log('E2E test user data seeded successfully');
}
