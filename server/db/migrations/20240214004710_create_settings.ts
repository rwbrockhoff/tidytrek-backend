import type { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';
import { DEFAULT_PALETTE } from '../../utils/constants.js';

const weightUnitConstraints = ['lb', 'kg', 'oz', 'g'];

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(t.userSettings, (table) => {
		table.increments('user_settings_id').unsigned().primary();
		table.uuid('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(t.user).onDelete('CASCADE');
		table.boolean('public_profile').defaultTo(true).notNullable();
		table.string('palette', 25).defaultTo(DEFAULT_PALETTE).notNullable();
		table.boolean('dark_mode').defaultTo(false).notNullable();
		table
			.string('weight_unit', 10)
			.checkIn(weightUnitConstraints)
			.defaultTo('lb')
			.notNullable();
		table.string('currency_unit', 10).defaultTo('USD').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(t.userSettings);
}
