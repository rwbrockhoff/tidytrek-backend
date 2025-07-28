import type { Knex } from 'knex';
import { Tables } from '../tables.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(Tables.User, (table) => {
		table.uuid('user_id').unsigned().primary();
		table.string('first_name', 100).notNullable();
		table.string('last_name', 100).notNullable();
		table.string('email').unique().notNullable();
		table.index('email');
		table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
		table.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(Tables.User);
}
