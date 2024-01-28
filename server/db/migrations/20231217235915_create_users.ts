import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('users', (table) => {
		table.increments('user_id').unsigned().primary();
		table.string('name').notNullable();
		table.string('email').unique().notNullable();
		table.string('password').notNullable();
		table.string('username').unique().nullable();
		table.string('reset_password_token').unique().nullable();
		table.string('reset_password_token_expiration').nullable();
		table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
		table.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('users');
}
