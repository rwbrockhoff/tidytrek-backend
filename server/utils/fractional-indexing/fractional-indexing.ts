// Fractional Indexing for Drag & Drop
// Uses VARCHAR storage with ::NUMERIC casting for proper sorting

import knex from '../../db/connection.js';
import { tables as t } from '../../../knexfile.js';
import { PackItem } from '../../types/packs/pack-types.js';

// Type for items that can be moved to gear closet (allows null pack_id/pack_category_id)
type MovablePackItem = Omit<PackItem, 'pack_id' | 'pack_category_id'> & {
	pack_id: number | null;
	pack_category_id: number | null;
};

const REBALANCE_THRESHOLD = 12; // When to trigger rebalance
export const DEFAULT_INCREMENT = 1000; // Default gap between fractional indexes

// Type definitions
export type TableName = 'pack_item' | 'pack_category' | 'pack';
export type IndexColumn = 'pack_item_index' | 'pack_category_index' | 'pack_index';
export type WhereConditions = Record<string, string | number | null>;
export type UpdateFields = Record<string, string | null>;
export type KnexRecord = Record<string, string | number | null>;

interface MoveResult {
	newIndex: string;
	rebalanced: boolean;
}

// Helper functions
function isValidNumber(value: number): boolean {
	return !isNaN(value);
}

// Calculate a new fractional index between two existing indexes
export function calculateMidpoint(prevIndex?: string, nextIndex?: string): string {
	// Handle edge cases
	if (!prevIndex && !nextIndex) return DEFAULT_INCREMENT.toString(); // First item
	if (!prevIndex) return calculateBefore(nextIndex!);
	if (!nextIndex) return calculateAfter(prevIndex!);

	const prev = parseFloat(prevIndex);
	const next = parseFloat(nextIndex);

	// Handle invalid numbers
	if (!isValidNumber(prev) || !isValidNumber(next)) {
		return DEFAULT_INCREMENT.toString();
	}

	// Calculate midpoint normally
	const midpoint = (prev + next) / 2;
	return midpoint.toString();
}

// Generate index before the first item
function calculateBefore(firstIndex: string): string {
	const first = parseFloat(firstIndex);

	// Handle invalid numbers
	if (!isValidNumber(first)) {
		return DEFAULT_INCREMENT.toString();
	}

	// Handle edge case where first item has index 0 or negative
	if (first <= 0) return (-DEFAULT_INCREMENT).toString(); // Use consistent negative increment, we'll rebalance the existing item

	return (first / 2).toString();
}

// Generate index after the last item
export function calculateAfter(lastIndex: string): string {
	const last = parseFloat(lastIndex);

	if (!isValidNumber(last)) return DEFAULT_INCREMENT.toString(); // Fallback for invalid indexes

	return (last + DEFAULT_INCREMENT).toString();
}

// Generate a sequence of evenly spaced indexes
export function generateSequence(
	count: number,
	startValue = DEFAULT_INCREMENT,
	gap = DEFAULT_INCREMENT,
): string[] {
	// Validate inputs
	if (!isValidNumber(count) || count < 0) return [];
	if (!isValidNumber(startValue) || !isValidNumber(gap) || gap <= 0) {
		startValue = DEFAULT_INCREMENT;
		gap = DEFAULT_INCREMENT;
	}

	return Array.from({ length: count }, (_, i) => (startValue + i * gap).toString());
}

// Get the next fractional index for appending to end of a list
// Find last item, calculate index after it
export async function getNextAppendIndex(
	table: TableName,
	indexColumn: IndexColumn,
	whereConditions: WhereConditions,
	defaultIndex = DEFAULT_INCREMENT.toString(),
): Promise<string> {
	const [lastItem] = await knex(table)
		.select(indexColumn)
		.where(whereConditions)
		.orderByRaw(`?? ::NUMERIC DESC`, [indexColumn])
		.limit(1);

	// Get the index value from the result
	const indexValue = lastItem?.[indexColumn];

	return lastItem && indexValue != null && indexValue !== 'undefined'
		? calculateAfter(indexValue)
		: defaultIndex;
}

// Handle fractional index move with automatic rebalancing for top position conflicts
// For moving items and rebalancing when placing before index 0
export async function moveWithFractionalIndex(
	table: TableName,
	indexColumn: IndexColumn,
	itemIdColumn: string,
	itemId: string | number,
	prevIndex: string | undefined,
	nextIndex: string | undefined,
	whereConditions: WhereConditions,
	updateFields: UpdateFields = {},
): Promise<MoveResult> {
	// Check for invalid ordering (would need rebalancing)
	if (prevIndex && nextIndex) {
		const prevFloat = parseFloat(prevIndex);
		const nextFloat = parseFloat(nextIndex);
		if (isValidNumber(prevFloat) && isValidNumber(nextFloat) && prevFloat >= nextFloat) {
			// Invalid ordering detected - rebalance entire list
			const cleanPosition = await rebalanceIndexes(
				table,
				indexColumn,
				whereConditions,
				itemId,
			);
			// Update with the new clean position
			await knex(table)
				.update({ [indexColumn]: cleanPosition, ...updateFields })
				.where({ [itemIdColumn]: itemId, ...whereConditions });
			return { newIndex: cleanPosition, rebalanced: true };
		}
	}

	// Calculate new fractional index
	const newIndex = calculateMidpoint(prevIndex, nextIndex);

	let rebalanced = false;

	// Check if rebalancing is needed
	const decimalPlaces = newIndex.split('.')[1]?.length || 0;
	if (decimalPlaces > REBALANCE_THRESHOLD) {
		// Rebalance and get the clean append position for this item
		const cleanPosition = await rebalanceIndexes(
			table,
			indexColumn,
			whereConditions,
			itemId,
		);
		// Update with the new clean position
		await knex(table)
			.update({ [indexColumn]: cleanPosition, ...updateFields })
			.where({ [itemIdColumn]: itemId, ...whereConditions });
		return { newIndex: cleanPosition, rebalanced: true };
	}

	// Rebalance: move the existing "top" item to index 0, new item gets negative increment
	if (newIndex === (-DEFAULT_INCREMENT).toString() && nextIndex !== undefined) {
		const nextIndexFloat = parseFloat(nextIndex);
		if (isValidNumber(nextIndexFloat) && nextIndexFloat <= 0) {
			await knex(table)
				.update({ [indexColumn]: '0' })
				.where(whereConditions)
				.andWhere(indexColumn, nextIndex);

			rebalanced = true;
		}
	}

	// Update the moved item with new index and any additional fields passed in
	await knex(table)
		.update({
			[indexColumn]: newIndex,
			...updateFields,
		})
		.where({ [itemIdColumn]: itemId, ...whereConditions });
	return { newIndex, rebalanced };
}

// Bulk move pack items to gear closet with sequential fractional indexes
// Sets pack_id and pack_category_id to NULL (moves to gear closet)
export async function bulkMoveToGearCloset(
	items: MovablePackItem[],
	userId: string,
): Promise<void> {
	if (items.length === 0) return;

	// Calculate starting index for gear closet items
	const startIndex = await getNextAppendIndex(
		t.packItem as TableName,
		'pack_item_index',
		{
			user_id: userId,
			pack_id: null,
			pack_category_id: null,
		},
	);

	// Generate sequence of indexes for all items
	const indexes = generateSequence(items.length, parseFloat(startIndex));

	// Bulk update using PostgreSQL's ON CONFLICT DO UPDATE
	const updates = items.map((item: MovablePackItem, index) => ({
		...item,
		pack_item_index: indexes[index],
		pack_category_id: null,
		pack_id: null,
	}));

	await knex(t.packItem)
		.insert(updates)
		.onConflict('pack_item_id')
		.merge(['pack_item_index', 'pack_category_id', 'pack_id']);
}

// Rebalance fractional indexes when precision gets too high
// Spreads items evenly with DEFAULT_INCREMENT gaps
export async function rebalanceIndexes(
	table: TableName,
	indexColumn: IndexColumn,
	whereConditions: WhereConditions,
	excludeItemId?: string | number,
): Promise<string> {
	// Determine primary key column for exclusion
	const primaryKeyMap = {
		[t.packItem]: 'pack_item_id',
		[t.packCategory]: 'pack_category_id',
		[t.pack]: 'pack_id',
	};
	const primaryKey = primaryKeyMap[table];

	// Get all items in order, excluding the item being moved to avoid double-processing
	const items = await knex(table)
		.select('*')
		.where(whereConditions)
		.modify((query) => {
			if (excludeItemId) {
				query.whereNot(primaryKey, excludeItemId);
			}
		})
		.orderByRaw(`?? ::NUMERIC ASC`, [indexColumn]);

	// Edge case that rebalanceIndexes is called with zero items
	if (items.length === 0) return DEFAULT_INCREMENT.toString();

	// Generate new evenly spaced indexes
	const newIndexes = generateSequence(items.length);

	// Prepare updates with only the new index - keep all other fields unchanged
	const updates = items.map((item: KnexRecord, index: number) => ({
		...item,
		[indexColumn]: newIndexes[index],
	}));

	// Update only the index column (reuse primaryKey from above)
	// Only merge the index column, leave everything else unchanged
	await knex(table).insert(updates).onConflict(primaryKey).merge([indexColumn]);

	return (parseFloat(newIndexes[newIndexes.length - 1]) + DEFAULT_INCREMENT).toString();
}
