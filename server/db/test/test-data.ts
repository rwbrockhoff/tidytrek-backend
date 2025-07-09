import { type MockPackItem } from '../../types/packs/pack-types.js';

// Test user for e2e tests
export const e2eTestUser = {
	userId: '280e5ff0-5eee-4fe0-8d1e-50cc58ce2ea4',
	first_name: 'Test',
	last_name: 'User',
	email: 'test@tidytrek.co',
	username: 'testUser123',
	trailName: 'TestHiker',
};

export const e2eTestPack = {
	pack_name: 'Test Pack',
	pack_description: 'Pack for E2E testing',
	pack_public: true,
	pack_location_tag: 'Test Location',
	pack_season_tag: 'Test Season',
	pack_duration_tag: 'Test Duration',
	pack_distance_tag: 'Test Distance',
	pack_index: '1000',
};

export const e2eTestCategory = {
	pack_category_name: 'Test Category',
	pack_category_index: '1000',
};

export const e2eTestPackItems = [
	{
		pack_item_name: 'Hyperlite Mountain Gear SW 2400',
		pack_item_description: 'Main backpack for summer backpacking',
		pack_item_quantity: 1,
		pack_item_weight: 28,
		pack_item_price: 295,
		pack_item_index: '1000',
	},
	{
		pack_item_name: 'Enlighented Equipment Quilt',
		pack_item_description: '20 F Version with overstuff',
		pack_item_quantity: 1,
		pack_item_weight: 1.5,
		pack_item_unit: 'lb',
		pack_item_price: 225,
		pack_item_index: '2000',
	},
];

export const e2eMultiCategoryPack = {
	pack_name: 'Multi Category Test Pack',
	pack_description: 'Pack with multiple categories for testing',
	pack_public: false,
	pack_location_tag: 'Test Location',
	pack_season_tag: 'Test Season',
	pack_duration_tag: 'Test Duration',
	pack_distance_tag: 'Test Distance',
	pack_index: '2000',
};

export const e2eTestCategories = [
	{
		pack_category_name: 'Big 3',
		pack_category_index: '1000',
	},
	{
		pack_category_name: 'Clothing',
		pack_category_index: '2000',
	},
	{
		pack_category_name: 'Kitchen',
		pack_category_index: '3000',
	},
];

export const e2eBig3Items: MockPackItem[] = [
	{
		pack_item_name: 'Hyperlite Mountain Gear SW 2400',
		pack_item_description: 'Main backpack',
		pack_item_quantity: 1,
		pack_item_weight: 28,
		pack_item_price: 295,
		pack_item_index: '1000',
		user_id: e2eTestUser.userId,
	},
	{
		pack_item_name: 'Big Agnes Copper Spur HV UL2',
		pack_item_description: 'Two person tent',
		pack_item_quantity: 1,
		pack_item_weight: 42,
		pack_item_price: 450,
		pack_item_index: '2000',
		user_id: e2eTestUser.userId,
	},
];

export const e2eClothingItems: MockPackItem[] = [
	{
		pack_item_name: 'Patagonia Houdini Jacket',
		pack_item_description: 'Wind jacket',
		pack_item_quantity: 1,
		pack_item_weight: 3.2,
		pack_item_price: 120,
		pack_item_index: '1000',
		user_id: e2eTestUser.userId,
	},
];

export const e2eKitchenItems: MockPackItem[] = [
	{
		pack_item_name: 'Jetboil Flash',
		pack_item_description: 'Cooking system',
		pack_item_quantity: 1,
		pack_item_weight: 13.1,
		pack_item_price: 100,
		pack_item_index: '1000',
		user_id: e2eTestUser.userId,
	},
];

// Gear closet test items
export const e2eGearClosetItems: MockPackItem[] = [
	{
		pack_item_name: 'Fizan Hiking Poles',
		pack_item_description: 'For trekking pole tent',
		pack_item_quantity: 2,
		pack_item_weight: 16,
		pack_item_price: 80,
		pack_item_index: '1000',
		pack_id: null,
		pack_category_id: null,
		user_id: e2eTestUser.userId,
	},
	{
		pack_item_name: 'Rab Quilt Liner',
		pack_item_description: 'Keep quilt clean',
		pack_item_quantity: 1,
		pack_item_weight: 16,
		pack_item_price: 60,
		pack_item_index: '2000',
		pack_id: null,
		pack_category_id: null,
		user_id: e2eTestUser.userId,
	},
	{
		pack_item_name: 'Darn Tough Fall/Winter socks',
		pack_item_description: 'Thicker socks for fall/winter backpacking trips',
		pack_item_quantity: 1,
		pack_item_weight: 16,
		pack_item_price: 25,
		pack_item_index: '3000',
		pack_id: null,
		pack_category_id: null,
		user_id: e2eTestUser.userId,
	},
];
