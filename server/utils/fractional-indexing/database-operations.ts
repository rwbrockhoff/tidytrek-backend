import knex from '../../db/connection.js';
import { Tables } from '../../db/tables.js';
import {
	calculateMidpoint,
	calculateAfter,
	generateSequence,
	needsRebalancing,
	hasInvalidOrdering,
	DEFAULT_INCREMENT,
} from './calculations.js';
import {
	TableName,
	IndexColumn,
	WhereConditions,
	UpdateFields,
	KnexRecord,
	MovablePackItem,
	MoveResult,
} from './types.js';

function isIndexableTable(table: string): table is TableName {
	return ['pack_item', 'pack_category', 'pack'].includes(table);
}

type TableIndexMap = {
	pack_item: 'pack_item_index';
	pack_category: 'pack_category_index';
	pack: 'pack_index';
};

function getIndexColumnForTable(table: TableName): TableIndexMap[TableName] {
	const map: TableIndexMap = {
		pack_item: 'pack_item_index',
		pack_category: 'pack_category_index',
		pack: 'pack_index',
	};
	return map[table];
}

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

	const indexValue = lastItem?.[indexColumn];

	return lastItem && indexValue != null && indexValue !== 'undefined'
		? calculateAfter(indexValue)
		: defaultIndex;
}

/**
 * Moves database item using fractional indexing with rebalancing
 * Handles drag-and-drop while maintaining proper sort order
 *
 * @param table - Database table name
 * @param indexColumn - Column name storing index values
 * @param itemIdColumn - Column name for item ID
 * @param itemId - Item ID being moved
 * @param prevIndex - Previous item index (item that should be before)
 * @param nextIndex - Next item index (item that should be after)
 * @param whereConditions - Additional WHERE clause conditions for update (packCategoryId, etc)
 * @param updateFields - Additional fields to update during the move
 * @returns Object containing new index and whether or not it rebalanced
 */
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
	if (hasInvalidOrdering(prevIndex, nextIndex)) {
		const cleanPosition = await rebalanceIndexes(
			table,
			indexColumn,
			whereConditions,
			itemId,
		);
		await knex(table)
			.update({ [indexColumn]: cleanPosition, ...updateFields })
			.where({ [itemIdColumn]: itemId, ...whereConditions });
		return { newIndex: cleanPosition, rebalanced: true };
	}

	const newIndex = calculateMidpoint(prevIndex, nextIndex);
	let rebalanced = false;

	if (needsRebalancing(newIndex)) {
		const cleanPosition = await rebalanceIndexes(
			table,
			indexColumn,
			whereConditions,
			itemId,
		);
		await knex(table)
			.update({ [indexColumn]: cleanPosition, ...updateFields })
			.where({ [itemIdColumn]: itemId, ...whereConditions });
		return { newIndex: cleanPosition, rebalanced: true };
	}

	if (newIndex === (-DEFAULT_INCREMENT).toString() && nextIndex !== undefined) {
		const nextIndexFloat = parseFloat(nextIndex);
		if (!isNaN(nextIndexFloat) && nextIndexFloat <= 0) {
			await knex(table)
				.update({ [indexColumn]: '0' })
				.where(whereConditions)
				.andWhere(indexColumn, nextIndex);

			rebalanced = true;
		}
	}

	await knex(table)
		.update({
			[indexColumn]: newIndex,
			...updateFields,
		})
		.where({ [itemIdColumn]: itemId, ...whereConditions });
	return { newIndex, rebalanced };
}

export async function bulkMoveToGearCloset(
	items: MovablePackItem[],
	userId: string,
): Promise<void> {
	if (items.length === 0) return;

	const startIndex = await getNextAppendIndex(Tables.PackItem, 'pack_item_index', {
		user_id: userId,
		pack_id: null,
		pack_category_id: null,
	});

	const indexes = generateSequence(items.length, parseFloat(startIndex));

	const updates = items.map((item: MovablePackItem, index) => ({
		...item,
		pack_item_index: indexes[index],
		pack_category_id: null,
		pack_id: null,
	}));

	await knex(Tables.PackItem)
		.insert(updates)
		.onConflict('pack_item_id')
		.merge(['pack_item_index', 'pack_category_id', 'pack_id']);
}

/**
 * Rebalances fractional indexes when they become too precise or invalid
 * Regenerates clean, evenly-spaced index values for improved performance
 *
 * @param table - Database table containing items to rebalance
 * @param indexColumn - Column storing fractional index values
 * @param whereConditions - Conditions to scope which items get rebalanced
 * @param excludeItemId - Optional item ID to exclude from rebalancing operation
 * @returns New index value that can be safely used for the excluded item
 */
export async function rebalanceIndexes(
	table: TableName,
	indexColumn: IndexColumn,
	whereConditions: WhereConditions,
	excludeItemId?: string | number,
): Promise<string> {
	if (!isIndexableTable(table)) {
		return DEFAULT_INCREMENT.toString();
	}

	const primaryKeyMap = {
		[Tables.PackItem]: 'pack_item_id',
		[Tables.PackCategory]: 'pack_category_id',
		[Tables.Pack]: 'pack_id',
	};
	const primaryKey = primaryKeyMap[table];

	const items = await knex(table)
		.select('*')
		.where(whereConditions)
		.modify((query) => {
			if (excludeItemId) {
				query.whereNot(primaryKey, excludeItemId);
			}
		})
		.orderByRaw(`?? ::NUMERIC ASC`, [indexColumn]);

	if (items.length === 0) return DEFAULT_INCREMENT.toString();

	const newIndexes = generateSequence(items.length);

	const updates = items.map((item: KnexRecord, index: number) => ({
		...item,
		[indexColumn]: newIndexes[index],
	}));

	const tableIndexColumn = getIndexColumnForTable(table);
	await knex(table)
		.insert(updates)
		.onConflict(primaryKey)
		.merge({
			[tableIndexColumn]: knex.ref(`excluded.${tableIndexColumn}`),
		});

	return (parseFloat(newIndexes[newIndexes.length - 1]) + DEFAULT_INCREMENT).toString();
}
