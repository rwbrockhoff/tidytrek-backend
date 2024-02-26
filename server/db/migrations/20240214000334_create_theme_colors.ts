import type { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';
import { themeColorNames } from '../../utils/constraints.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(t.themeColor, (table) => {
		table.increments('theme_color_id').unsigned().primary();
		table.integer('theme_id').unsigned();
		table.foreign('theme_id').references('theme_id').inTable(t.theme).onDelete('CASCADE');
		table.string('theme_color_name').checkIn(themeColorNames).notNullable();
		table.string('theme_color').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(t.themeColor);
}
