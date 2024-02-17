import type { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';

const weightUnitConstraints = ['lb', 'kg', 'oz', 'g'];

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(t.userSettings, (table) => {
		table.increments('user_settings_id').unsigned().primary();
		table.integer('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(t.user).onDelete('CASCADE');
		table.integer('theme_id').unsigned();
		table.foreign('theme_id').references('theme_id').inTable(t.theme);
		table.boolean('public_profile').defaultTo(true).notNullable();
		table.boolean('topo_background').defaultTo(false).notNullable();
		table.boolean('dark_theme').defaultTo(false).notNullable();
		table
			.string('weight_unit')
			.checkIn(weightUnitConstraints)
			.defaultTo('lb')
			.notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(t.userSettings);
}
