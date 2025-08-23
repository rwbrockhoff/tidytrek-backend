import type { Knex } from 'knex';
import { DEFAULT_PALETTE } from '../../utils/constants.js';

export async function up(knex: Knex): Promise<void> {
	// Add palette column to pack table
	await knex.schema.alterTable('pack', (table) => {
		table.string('palette').defaultTo(DEFAULT_PALETTE);
	});

	// Use existing palette from user_settings as pack default
	await knex.raw(`
		UPDATE pack 
		SET palette = user_settings.palette 
		FROM user_settings 
		WHERE pack.user_id = user_settings.user_id 
		  AND user_settings.palette IS NOT NULL
	`);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('pack', (table) => {
		table.dropColumn('palette');
	});
}
