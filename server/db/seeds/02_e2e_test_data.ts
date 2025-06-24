import { Knex } from 'knex';
import { type MockPackCategory } from '@/types/packs/packTypes.js';
import { tables as t } from '../../../knexfile.js';
import { DEFAULT_PALETTE_COLOR, DEFAULT_THEME_NAME } from '../../utils/constants.js';
import {
	e2eTestUser,
	e2eTestPack,
	e2eTestCategory,
	e2eTestPackItems,
	e2eMultiCategoryPack,
	e2eTestCategories,
	e2eBig3Items,
	e2eClothingItems,
	e2eKitchenItems,
	e2eGearClosetItems,
} from '../test/testData.js';

export async function seed(knex: Knex): Promise<void> {
	// Clean up existing test data
	await knex(t.packItem).where('user_id', e2eTestUser.userId).del();
	await knex(t.packCategory).where('user_id', e2eTestUser.userId).del();
	await knex(t.pack).where('user_id', e2eTestUser.userId).del();
	await knex(t.socialLink).where('user_id', e2eTestUser.userId).del();
	await knex(t.userProfile).where('user_id', e2eTestUser.userId).del();
	await knex(t.userSettings).where('user_id', e2eTestUser.userId).del();
	await knex(t.user).where('user_id', e2eTestUser.userId).del();

	// Insert test user
	await knex(t.user).insert({
		user_id: e2eTestUser.userId,
		first_name: e2eTestUser.first_name,
		last_name: e2eTestUser.last_name,
		email: e2eTestUser.email,
	});

	// Create user profile and settings for test user
	await knex(t.userProfile).insert({
		user_id: e2eTestUser.userId,
		trail_name: e2eTestUser.trailName,
		username: e2eTestUser.username,
	});

	await knex(t.userSettings).insert({
		user_id: e2eTestUser.userId,
		theme_name: DEFAULT_THEME_NAME,
		dark_mode: false,
		public_profile: false, // Test user has private profile
		weight_unit: 'oz', // Different from mock user for testing
		currency_unit: 'USD',
	});

	// Create social links for test user
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

	// Create basic test pack for drag/drop testing
	const [testPack] = await knex(t.pack)
		.insert({
			...e2eTestPack,
			user_id: e2eTestUser.userId,
		})
		.returning('*');

	const [testPackCategory] = await knex(t.packCategory)
		.insert({
			...e2eTestCategory,
			user_id: e2eTestUser.userId,
			pack_id: testPack.pack_id,
			pack_category_color: DEFAULT_PALETTE_COLOR,
		})
		.returning('*');

	// Add the 2 test items with predictable indexes for drag/drop testing
	const testPackItemsWithIds = e2eTestPackItems.map((item) => ({
		...item,
		pack_id: testPack.pack_id,
		pack_category_id: testPackCategory.pack_category_id,
		user_id: e2eTestUser.userId,
	}));

	await knex(t.packItem).insert(testPackItemsWithIds);

	// Create multi-category pack for advanced testing
	const [multiPack] = await knex(t.pack)
		.insert({
			...e2eMultiCategoryPack,
			user_id: e2eTestUser.userId,
		})
		.returning('*');

	// Create categories for multi-category pack
	const categoriesToInsert: MockPackCategory[] = e2eTestCategories.map((category) => ({
		...category,
		user_id: e2eTestUser.userId,
		pack_id: multiPack.pack_id,
		pack_category_color: DEFAULT_PALETTE_COLOR,
	}));

	const createdCategories = await knex(t.packCategory)
		.insert(categoriesToInsert)
		.returning('*');

	// Add items to each category
	const big3ItemsWithIds = e2eBig3Items.map((item) => ({
		...item,
		pack_id: multiPack.pack_id,
		pack_category_id: createdCategories[0].pack_category_id,
	}));

	const clothingItemsWithIds = e2eClothingItems.map((item) => ({
		...item,
		pack_id: multiPack.pack_id,
		pack_category_id: createdCategories[1].pack_category_id,
	}));

	const kitchenItemsWithIds = e2eKitchenItems.map((item) => ({
		...item,
		pack_id: multiPack.pack_id,
		pack_category_id: createdCategories[2].pack_category_id,
	}));

	await knex(t.packItem).insert([
		...big3ItemsWithIds,
		...clothingItemsWithIds,
		...kitchenItemsWithIds,
		...e2eGearClosetItems,
	]);
}