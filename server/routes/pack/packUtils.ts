import knex from '../../db/connection.js';
import { themeColors } from '../../utils/themeColors.js';

async function changeItemOrder(
	userId: number,
	table: string,
	property: string,
	currIndex: number,
	prevIndex: number,
) {
	try {
		// higher position visually, making it a lower index in our table
		const higherPos = currIndex < prevIndex;
		// move pack item indexes to allow item at new position
		// handle lower or higher position for items in same category
		return higherPos
			? await knex.raw(`UPDATE ${table}
				SET ${property} = ${property} + 1 
				WHERE ${property} >= ${currIndex} and ${property} < ${prevIndex}
				AND user_id = ${userId}`)
			: await knex.raw(`UPDATE ${table} 
				SET ${property} = ${property} - 1 
				WHERE ${property} <= ${currIndex} AND ${property} > ${prevIndex}
				AND user_id = ${userId}`);
	} catch (err) {
		return new Error('There was an error changing the pack item index');
	}
}

// Generate a new index based on the current pack context
// used when we can't gurantee item created is the first item (0 index)
// cannot auto increment indexes in pg because this is used for ordering purposes

async function generateIndex(
	tableName: string,
	indexName: string,
	conditions: {
		user_id: number;
		pack_id?: number | string | null;
		pack_category_id?: number;
		pack_item_id?: number;
	},
): Promise<number> {
	const maxResult = await knex(tableName).max(indexName).where(conditions).first();
	return maxResult?.max + 1 || 0;
}

async function getMaxItemIndex(user_id: number, pack_id: string | number | null) {
	try {
		const maxResult = await knex('pack_items')
			.max('pack_item_index')
			.where({ user_id, pack_id })
			.first();

		return maxResult?.max || 0;
	} catch (err) {
		return new Error('Error geting max index for item.');
	}
}

async function shiftPackItems(
	userId: number,
	packCategoryId: number | null,
	packItemIndex: number,
) {
	try {
		await knex.raw(`UPDATE pack_items
			SET pack_item_index = pack_item_index - 1
			WHERE user_id = ${userId} AND 
			${packCategoryId ? `pack_category_id = ${packCategoryId}` : `pack_category_id IS NULL`}
			AND pack_item_index >= ${packItemIndex}`);
	} catch (err) {
		return new Error('Error shifting item indexes.');
	}
}

function getThemeColor(index: number) {
	return themeColors.earthTones[index % 10];
}

export { generateIndex, changeItemOrder, getMaxItemIndex, shiftPackItems, getThemeColor };
