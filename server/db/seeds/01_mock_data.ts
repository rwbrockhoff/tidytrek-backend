import { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';
import { DEFAULT_PALETTE_COLOR, DEFAULT_THEME_NAME } from '../../utils/constants.js';
import {
	mockUser,
	mockPack,
	mockPack2,
	mockPackCategory,
	mockPackItems,
	mockGearClosetItems,
} from '../mock/mockData.js';
import { type MockPackItem } from '../../types/packs/packTypes.js';

const { first_name, last_name, email, userId: user_id, trailName, username } = mockUser;

export async function seed(knex: Knex): Promise<void> {
	// Clean up all mock data
	await knex(t.packItem).where('user_id', user_id).del();
	await knex(t.packCategory).where('user_id', user_id).del();
	await knex(t.pack).where('user_id', user_id).del();
	await knex(t.socialLink).where('user_id', user_id).del();
	await knex(t.userProfile).where('user_id', user_id).del();
	await knex(t.userSettings).where('user_id', user_id).del();
	await knex(t.user).where('user_id', user_id).del();

	// Insert mock user, profile, and settings
	await knex(t.user).insert({ user_id, first_name, last_name, email });

	await knex(t.userProfile).insert({
		user_id,
		trail_name: trailName,
		username,
	});

	await knex(t.userSettings).insert({
		user_id,
		theme_name: DEFAULT_THEME_NAME,
		dark_mode: false,
		public_profile: true,
		weight_unit: 'lb',
		currency_unit: 'USD',
	});

	// Create social links for mock user
	await knex(t.socialLink).insert([
		{
			user_id,
			platform_name: 'Instagram',
			social_link_url: 'https://instagram.com/tidytrekhiker',
		},
		{
			user_id,
			platform_name: 'YouTube',
			social_link_url: 'https://youtube.com/@RocketHikes',
		},
	]);

	// Create pack for main mock user
	const [pack] = await knex(t.pack)
		.insert({ ...mockPack, user_id })
		.returning('*');

	const [packCategory] = await knex(t.packCategory)
		.insert({
			...mockPackCategory,
			user_id,
			pack_id: pack.pack_id,
			pack_category_color: DEFAULT_PALETTE_COLOR,
		})
		.returning('*');

	const packItemsWithIds = mockPackItems.map((item: MockPackItem) => {
		item['pack_id'] = pack.pack_id;
		item['pack_category_id'] = packCategory.pack_category_id;
		return item;
	});

	await knex(t.packItem).insert([...packItemsWithIds, ...mockGearClosetItems]);

	await knex(t.pack)
		.insert({ ...mockPack2, user_id: user_id })
		.returning('*');
}
