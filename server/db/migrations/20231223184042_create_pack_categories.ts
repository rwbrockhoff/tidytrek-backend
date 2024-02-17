import type { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(t.packCategory, (table) => {
		table.increments('pack_category_id').unsigned().primary();
		table.integer('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(t.user).onDelete('CASCADE');
		table.integer('pack_id').unsigned().notNullable();
		table.foreign('pack_id').references('pack_id').inTable(t.pack);
		table.string('pack_category_name').notNullable();
		table.string('pack_category_color').nullable();
		table.integer('pack_category_index').unsigned().notNullable();
		table.index('pack_category_index');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(t.packCategory);
}
