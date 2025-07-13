import { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';
import { DEFAULT_PALETTE_COLOR, DEFAULT_PALETTE } from '../../utils/constants.js';
import {
	mockUser,
	mockPack,
	mockPack2,
	mockPackCategory,
	mockPackItems,
	mockGearClosetItems,
	mockPrivateUser,
	mockPrivatePack,
	mockPrivatePackCategory,
	mockPrivatePackItems,
} from '../mock/mock-data.js';
import { type MockPackItem } from '../../types/packs/pack-types.js';

const { first_name, last_name, email, userId: user_id, trailName, username } = mockUser;
const {
	first_name: privateFirstName,
	last_name: privateLastName,
	email: privateEmail,
	userId: privateUserId,
	trailName: privateTrailName,
	username: privateUsername,
} = mockPrivateUser;

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

	// Insert mock private user
	await knex(t.user).insert({
		user_id: privateUserId,
		first_name: privateFirstName,
		last_name: privateLastName,
		email: privateEmail,
	});

	await knex(t.userProfile).insert({
		user_id,
		trail_name: trailName,
		username,
	});

	await knex(t.userProfile).insert({
		user_id: privateUserId,
		trail_name: privateTrailName,
		username: privateUsername,
	});

	await knex(t.userSettings).insert({
		user_id,
		palette: DEFAULT_PALETTE,
		dark_mode: false,
		public_profile: true,
		weight_unit: 'metric',
		currency_unit: 'USD',
	});

	await knex(t.userSettings).insert({
		user_id: privateUserId,
		palette: DEFAULT_PALETTE,
		dark_mode: false,
		public_profile: false, // Private profile
		weight_unit: 'metric',
		currency_unit: 'USD',
	});

	// Create social links for mock user
	await knex(t.socialLink).insert([
		{
			user_id,
			social_link_url: 'https://instagram.com/tidytrekhiker',
		},
		{
			user_id,
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

	// Create pack for private user
	const [privatePack] = await knex(t.pack)
		.insert({ ...mockPrivatePack, user_id: privateUserId })
		.returning('*');

	const [privatePackCategory] = await knex(t.packCategory)
		.insert({
			...mockPrivatePackCategory,
			user_id: privateUserId,
			pack_id: privatePack.pack_id,
			pack_category_color: DEFAULT_PALETTE_COLOR,
		})
		.returning('*');

	const privatePackItemsWithIds = mockPrivatePackItems.map((item: MockPackItem) => {
		item['pack_id'] = privatePack.pack_id;
		item['pack_category_id'] = privatePackCategory.pack_category_id;
		return item;
	});

	await knex(t.packItem).insert(privatePackItemsWithIds);
}
