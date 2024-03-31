import type { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(t.theme, (table) => {
		table.increments('theme_id').unsigned().primary();
		table.uuid('user_id').unsigned();
		table.foreign('user_id').references('user_id').inTable(t.user).onDelete('CASCADE');
		table.boolean('tidytrek_theme').defaultTo(false).notNullable();
		table.string('theme_name').notNullable().defaultTo('Theme');
		table.check('?? IS NULL AND ?? = true OR ?? IS NOT NULL AND ?? = false', [
			'user_id',
			'tidytrek_theme',
			'user_id',
			'tidytrek_theme',
		]);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(t.theme);
}
