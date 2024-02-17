import type { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';
import { themeColorNames } from '../../utils/themeColors.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(t.themeColor, (table) => {
		table.increments('theme_color_id').unsigned().primary();
		table.integer('user_id').unsigned();
		table.foreign('user_id').references('user_id').inTable(t.user).onDelete('CASCADE');
		table.integer('theme_id').unsigned();
		table.foreign('theme_id').references('theme_id').inTable(t.theme);
		table.string('theme_color_name').checkIn(themeColorNames).notNullable();
		table.string('theme_color').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(t.themeColor);
}
