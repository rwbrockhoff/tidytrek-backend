import { Knex } from 'knex';
import { type MockPackCategory } from '@/types/packs/packTypes.js';
import { tables as t } from '../../../knexfile.js';
import { DEFAULT_PALETTE_COLOR } from '../../utils/constants.js';
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
	console.log('Seeding E2E pack data...');

	// Remove previous data
	await knex(t.packItem).where('user_id', e2eTestUser.userId).del();
	await knex(t.packCategory).where('user_id', e2eTestUser.userId).del();
	await knex(t.pack).where('user_id', e2eTestUser.userId).del();

	// Create basic test pack
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

	const testPackItemsWithIds = e2eTestPackItems.map((item) => ({
		...item,
		pack_id: testPack.pack_id,
		pack_category_id: testPackCategory.pack_category_id,
		user_id: e2eTestUser.userId,
	}));

	await knex(t.packItem).insert(testPackItemsWithIds);

	// Create multi-category pack
	const [multiPack] = await knex(t.pack)
		.insert({
			...e2eMultiCategoryPack,
			user_id: e2eTestUser.userId,
		})
		.returning('*');

	const categoriesToInsert: MockPackCategory[] = e2eTestCategories.map((category) => ({
		...category,
		user_id: e2eTestUser.userId,
		pack_id: multiPack.pack_id,
		pack_category_color: DEFAULT_PALETTE_COLOR,
	}));

	const createdCategories = await knex(t.packCategory)
		.insert(categoriesToInsert)
		.returning('*');

	// Add pack items for each category
	const big3ItemsWithIds = e2eBig3Items.map((item) => ({
		...item,
		pack_id: multiPack.pack_id,
		pack_category_id: createdCategories[0].pack_category_id,
		user_id: e2eTestUser.userId,
	}));

	const clothingItemsWithIds = e2eClothingItems.map((item) => ({
		...item,
		pack_id: multiPack.pack_id,
		pack_category_id: createdCategories[1].pack_category_id,
		user_id: e2eTestUser.userId,
	}));

	const kitchenItemsWithIds = e2eKitchenItems.map((item) => ({
		...item,
		pack_id: multiPack.pack_id,
		pack_category_id: createdCategories[2].pack_category_id,
		user_id: e2eTestUser.userId,
	}));

	// Add gear closet items
	const gearClosetItemsWithIds = e2eGearClosetItems.map((item) => ({
		...item,
		user_id: e2eTestUser.userId,
	}));

	await knex(t.packItem).insert([
		...big3ItemsWithIds,
		...clothingItemsWithIds,
		...kitchenItemsWithIds,
		...gearClosetItemsWithIds,
	]);

	console.log('E2E pack data seeded successfully');
}
