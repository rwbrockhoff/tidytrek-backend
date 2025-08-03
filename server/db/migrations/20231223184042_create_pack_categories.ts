import type { Knex } from 'knex';
import { Tables } from '../../db/tables.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(Tables.PackCategory, (table) => {
		table.increments('pack_category_id').unsigned().primary();
		table.uuid('user_id').unsigned().notNullable();
		table
			.foreign('user_id')
			.references('user_id')
			.inTable(Tables.User)
			.onDelete('CASCADE');
		table.integer('pack_id').unsigned().notNullable();
		table
			.foreign('pack_id')
			.references('pack_id')
			.inTable(Tables.Pack)
			.onDelete('CASCADE');
		table.string('pack_category_name', 100).notNullable().defaultTo('');
		table.string('pack_category_color', 50).nullable();
		table.string('pack_category_index', 20).notNullable().defaultTo('0');
		table.index('pack_category_index');
		table.index(['pack_id', 'pack_category_index']);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(Tables.PackCategory);
}
