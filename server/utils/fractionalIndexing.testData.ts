import { PackItem } from '../types/packs/packTypes.js';
import { mockUser } from '../db/mock/mockData.js';

// Extended PackItem type that allows null values for gear closet items
export type TestPackItem = Omit<PackItem, 'pack_id' | 'pack_category_id'> & {
	pack_id: number | null;
	pack_category_id: number | null;
};

export const testUserId = mockUser.userId;
export const testPackId = 1;

export const mockPackItem: Omit<TestPackItem, 'pack_item_index'> = {
	pack_item_name: 'Test Item',
	pack_item_description: 'Test Description',
	user_id: testUserId,
	pack_id: testPackId,
	pack_category_id: 1,
	pack_item_weight: 1,
	pack_item_unit: 'oz',
	pack_item_quantity: 1,
};

export const gearClosetConditions = {
	user_id: testUserId,
	pack_id: null,
	pack_category_id: null,
};

export const packConditions = {
	user_id: testUserId,
	pack_id: testPackId,
};

export function createTestItem(overrides: Partial<TestPackItem> = {}): TestPackItem {
	return {
		...mockPackItem,
		pack_item_index: '1000',
		...overrides,
	};
}

export function createTestItems(count: number, startIndex = 1000, gap = 1000): TestPackItem[] {
	return Array.from({ length: count }, (_, i) =>
		createTestItem({
			pack_item_name: `Item ${i + 1}`,
			pack_item_index: (startIndex + i * gap).toString(),
		})
	);
}