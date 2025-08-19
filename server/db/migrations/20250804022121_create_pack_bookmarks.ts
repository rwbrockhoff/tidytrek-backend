import type { Knex } from "knex";
import { Tables } from '../tables.js';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable(Tables.PackBookmarks, (table) => {
		table.increments('pack_bookmark_id').unsigned().primary();
		table.uuid('user_id').unsigned().notNullable();
		table.integer('pack_id').unsigned().notNullable();
		table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
		table.timestamp('updated_at').nullable().defaultTo(knex.fn.now());

		table.foreign('user_id').references('user_id').inTable(Tables.User).onDelete('CASCADE');
		table.foreign('pack_id').references('pack_id').inTable(Tables.Pack).onDelete('CASCADE');

		table.unique(['user_id', 'pack_id']);
		table.index('user_id');
		table.index('pack_id');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable(Tables.PackBookmarks);
}

