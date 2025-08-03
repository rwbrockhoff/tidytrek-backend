import type { Knex } from 'knex';
import { Tables } from '../tables.js';
import { DEFAULT_PALETTE } from '../../utils/constants.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(Tables.UserSettings, (table) => {
		table.increments('user_settings_id').unsigned().primary();
		table.uuid('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(Tables.User).onDelete('CASCADE');
		table.boolean('public_profile').defaultTo(true).notNullable();
		table.string('palette', 25).defaultTo(DEFAULT_PALETTE).notNullable();
		table.boolean('dark_mode').defaultTo(false).notNullable();
		table
			.string('weight_unit', 10)
			.checkIn(['imperial', 'metric'])
			.defaultTo('imperial')
			.notNullable();
		table.string('currency_unit', 10).defaultTo('USD').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(Tables.UserSettings);
}
