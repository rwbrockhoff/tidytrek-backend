import { Knex } from 'knex';
import { Tables } from '../tables.js';
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
import { packFields } from '../../routes/pack/pack-schemas.js';

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
	await knex(Tables.PackItem).where('user_id', user_id).del();
	await knex(Tables.PackCategory).where('user_id', user_id).del();
	await knex(Tables.Pack).where('user_id', user_id).del();
	await knex(Tables.SocialLink).where('user_id', user_id).del();
	await knex(Tables.UserProfile).where('user_id', user_id).del();
	await knex(Tables.UserSettings).where('user_id', user_id).del();
	await knex(Tables.User).where('user_id', user_id).del();

	// Insert mock user, profile, and settings
	await knex(Tables.User).insert({ user_id, first_name, last_name, email });

	// Insert mock private user
	await knex(Tables.User).insert({
		user_id: privateUserId,
		first_name: privateFirstName,
		last_name: privateLastName,
		email: privateEmail,
	});

	await knex(Tables.UserProfile).insert({
		user_id,
		trail_name: trailName,
		username,
	});

	await knex(Tables.UserProfile).insert({
		user_id: privateUserId,
		trail_name: privateTrailName,
		username: privateUsername,
	});

	await knex(Tables.UserSettings).insert({
		user_id,
		palette: DEFAULT_PALETTE,
		dark_mode: false,
		public_profile: true,
		weight_unit: 'metric',
		currency_unit: 'USD',
	});

	await knex(Tables.UserSettings).insert({
		user_id: privateUserId,
		palette: DEFAULT_PALETTE,
		dark_mode: false,
		public_profile: false, // Private profile
		weight_unit: 'metric',
		currency_unit: 'USD',
	});

	// Create social links for mock user
	await knex(Tables.SocialLink).insert([
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
	const [pack] = await knex(Tables.Pack)
		.insert({ ...mockPack, user_id })
		.returning(packFields);

	const [packCategory] = await knex(Tables.PackCategory)
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

	await knex(Tables.PackItem).insert([...packItemsWithIds, ...mockGearClosetItems]);

	await knex(Tables.Pack)
		.insert({ ...mockPack2, user_id: user_id })
		.returning(packFields);

	// Create pack for private user
	const [privatePack] = await knex(Tables.Pack)
		.insert({ ...mockPrivatePack, user_id: privateUserId })
		.returning(packFields);

	const [privatePackCategory] = await knex(Tables.PackCategory)
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

	await knex(Tables.PackItem).insert(privatePackItemsWithIds);
}
