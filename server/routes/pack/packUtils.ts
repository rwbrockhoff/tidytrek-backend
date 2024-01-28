import knex from '../../db/connection.js';
import { Buffer } from 'node:buffer';

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
	const response = await knex(tableName)
		.select(knex.raw(`MAX(${indexName})`))
		.where(conditions)
		.first();
	if ('max' in response) {
		if (typeof response['max'] === 'number') return response['max'] + 1;
		else return 0;
	}
	return 0;
	// if (response['max'] === null) return 0;
	// else return response['max'] + 1;
}

function generateDisplayId(packId: number) {
	return Buffer.from(`p${packId}`, 'utf8').toString('base64url');
}

export { generateIndex, generateDisplayId, changeItemOrder };
