import type { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(t.user, (table) => {
		table.uuid('user_id').unsigned().primary();
		table.string('first_name').notNullable();
		table.string('last_name').notNullable();
		table.string('email').unique().notNullable();
		table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
		table.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(t.user);
}
