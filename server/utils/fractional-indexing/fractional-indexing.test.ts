import {
	calculateMidpoint,
	calculateAfter,
	generateSequence,
	getNextAppendIndex,
	moveWithFractionalIndex,
	bulkMoveToGearCloset,
	rebalanceIndexes,
	type IndexColumn,
	type WhereConditions,
} from './index.js';
import knex from '../../db/connection.js';
import { Tables } from '../../db/tables.js';
import {
	testUserId,
	gearClosetConditions,
	packConditions,
	createTestItem,
	createTestItems,
} from './fractional-indexing-test-data.js';

beforeEach(async () => {
	await knex.migrate.rollback();
	await knex.migrate.latest();
	await knex.seed.run();
	await knex(Tables.PackItem).where('user_id', testUserId).del();
});

afterAll(async () => {
	await knex.migrate.rollback().then(() => knex.destroy());
});

describe('Pure Functions', () => {
	describe('calculateMidpoint', () => {
		it('should handle first item case', () => {
			expect(calculateMidpoint()).toBe('1000');
		});

		it('should calculate between two indexes', () => {
			expect(calculateMidpoint('1000', '3000')).toBe('2000');
		});

		it('should handle invalid numbers', () => {
			expect(calculateMidpoint('invalid', '2000')).toBe('1000');
		});
	});

	describe('calculateAfter', () => {
		it('should add increment to index', () => {
			expect(calculateAfter('1000')).toBe('2000');
		});

		it('should handle invalid input', () => {
			expect(calculateAfter('invalid')).toBe('1000');
		});
	});

	describe('generateSequence', () => {
		it('should generate correct sequence', () => {
			const result = generateSequence(3);
			expect(result).toEqual(['1000', '2000', '3000']);
		});

		it('should handle invalid count', () => {
			expect(generateSequence(-1)).toEqual([]);
		});
	});
});

describe('Database Operations', () => {
	describe('getNextAppendIndex', () => {
		it('should return default for empty table', async () => {
			const result = await getNextAppendIndex(
				Tables.PackItem,
				'pack_item_index' as IndexColumn,
				gearClosetConditions as WhereConditions,
			);
			expect(result).toBe('1000');
		});

		it('should calculate next after existing items', async () => {
			await knex(Tables.PackItem).insert(
				createTestItem({
					pack_item_index: '1500',
					pack_id: null,
					pack_category_id: null,
				}),
			);

			const result = await getNextAppendIndex(
				Tables.PackItem,
				'pack_item_index' as IndexColumn,
				gearClosetConditions as WhereConditions,
			);
			expect(result).toBe('2500');
		});
	});

	describe('moveWithFractionalIndex', () => {
		it('should move item with midpoint calculation', async () => {
			const [item] = await knex(Tables.PackItem)
				.insert(createTestItem())
				.returning('pack_item_id');

			const result = await moveWithFractionalIndex(
				Tables.PackItem,
				'pack_item_index' as IndexColumn,
				'pack_item_id',
				item.pack_item_id,
				'1000',
				'3000',
				packConditions as WhereConditions,
			);

			expect(result.newIndex).toBe('2000');
			expect(result.rebalanced).toBe(false);

			const updatedItem = await knex(Tables.PackItem)
				.where('pack_item_id', item.pack_item_id)
				.first();
			expect(updatedItem.pack_item_index).toBe('2000');
		});

		it('should trigger rebalancing on invalid ordering', async () => {
			const items = createTestItems(2);
			await knex(Tables.PackItem).insert(items);
			const [item] = await knex(Tables.PackItem)
				.where(packConditions)
				.returning('pack_item_id');

			const result = await moveWithFractionalIndex(
				Tables.PackItem,
				'pack_item_index' as IndexColumn,
				'pack_item_id',
				item.pack_item_id,
				'3000',
				'1000',
				packConditions as WhereConditions,
			);

			expect(result.rebalanced).toBe(true);
		});

		it('should trigger rebalancing on high precision', async () => {
			const [item] = await knex(Tables.PackItem)
				.insert(createTestItem())
				.returning('pack_item_id');
			const highPrecisionPrev = '1000.1234567890123';
			const highPrecisionNext = '1000.1234567890124';

			const result = await moveWithFractionalIndex(
				Tables.PackItem,
				'pack_item_index' as IndexColumn,
				'pack_item_id',
				item.pack_item_id,
				highPrecisionPrev,
				highPrecisionNext,
				packConditions as WhereConditions,
			);

			expect(result.rebalanced).toBe(true);
		});
	});

	describe('rebalanceIndexes', () => {
		it('should rebalance multiple items with even spacing', async () => {
			const items = [
				createTestItem({ pack_item_name: 'Item 1', pack_item_index: '100.1234567' }),
				createTestItem({ pack_item_name: 'Item 2', pack_item_index: '100.1234568' }),
				createTestItem({ pack_item_name: 'Item 3', pack_item_index: '100.1234569' }),
			];
			await knex(Tables.PackItem).insert(items);

			await rebalanceIndexes(
				Tables.PackItem,
				'pack_item_index' as IndexColumn,
				packConditions as WhereConditions,
			);

			const rebalancedItems = await knex(Tables.PackItem)
				.where(packConditions)
				.orderByRaw('pack_item_index::NUMERIC ASC');

			expect(rebalancedItems[0].pack_item_index).toBe('1000');
			expect(rebalancedItems[1].pack_item_index).toBe('2000');
			expect(rebalancedItems[2].pack_item_index).toBe('3000');
		});

		it('should exclude specified item', async () => {
			const [excludedItem] = await knex(Tables.PackItem)
				.insert(createTestItem({ pack_item_index: '500' }))
				.returning('pack_item_id');
			await knex(Tables.PackItem).insert(createTestItem({ pack_item_index: '600' }));

			await rebalanceIndexes(
				Tables.PackItem,
				'pack_item_index' as IndexColumn,
				packConditions as WhereConditions,
				excludedItem.pack_item_id,
			);

			const excluded = await knex(Tables.PackItem)
				.where('pack_item_id', excludedItem.pack_item_id)
				.first();
			expect(excluded.pack_item_index.toString()).toBe('500');
		});
	});

	describe('bulkMoveToGearCloset', () => {
		it('should move multiple items to gear closet', async () => {
			const items = createTestItems(2);
			await knex(Tables.PackItem).insert(items);

			await bulkMoveToGearCloset(items, testUserId);

			const movedItems = await knex(Tables.PackItem)
				.where(gearClosetConditions)
				.orderByRaw('pack_item_index::NUMERIC ASC');

			expect(movedItems).toHaveLength(2);
			expect(movedItems[0].pack_id).toBeNull();
			expect(movedItems[0].pack_category_id).toBeNull();
			expect(parseFloat(movedItems[1].pack_item_index)).toBeGreaterThan(
				parseFloat(movedItems[0].pack_item_index),
			);
		});

		it('should handle empty array', async () => {
			await expect(bulkMoveToGearCloset([], testUserId)).resolves.not.toThrow();
		});
	});
});

describe('Edge Cases', () => {
	it('should handle zero and negative numbers', () => {
		const result1 = calculateMidpoint('-1000', '1000');
		expect(parseFloat(result1)).toBe(0);

		const result2 = calculateMidpoint('0', '2000');
		expect(parseFloat(result2)).toBe(1000);
	});

	it('should handle very small differences', () => {
		const result = calculateMidpoint('1.0000000001', '1.0000000002');
		expect(parseFloat(result)).toBeGreaterThan(1.0000000001);
		expect(parseFloat(result)).toBeLessThan(1.0000000002);
	});
});
