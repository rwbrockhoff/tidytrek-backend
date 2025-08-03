import { MockPackItem } from '../../types/packs/pack-types.js';
import { mockUser } from '../../db/mock/mock-data.js';
import { WeightUnit } from '../../types/units.js';

export const testUserId = mockUser.userId;
export const testPackId = 1;

export const mockPackItem: Omit<MockPackItem, 'pack_item_index'> = {
	pack_item_name: 'Test Item',
	pack_item_description: 'Test Description',
	user_id: testUserId,
	pack_id: testPackId,
	pack_category_id: 1,
	pack_item_weight: 1,
	pack_item_weight_unit: WeightUnit.oz,
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

export function createTestItem(overrides: Partial<MockPackItem> = {}): MockPackItem {
	return {
		...mockPackItem,
		pack_item_index: '1000',
		...overrides,
	};
}

export function createTestItems(
	count: number,
	startIndex = 1000,
	gap = 1000,
): MockPackItem[] {
	return Array.from({ length: count }, (_, i) =>
		createTestItem({
			pack_item_name: `Item ${i + 1}`,
			pack_item_index: (startIndex + i * gap).toString(),
		}),
	);
}
