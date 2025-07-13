import type { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(t.socialLink, (table) => {
		table.increments('social_link_id').unsigned().primary();
		table.uuid('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(t.user).onDelete('CASCADE');
		table.text('social_link_url').notNullable();
		table.index('user_id');
	});

	await knex.schema.createTable(t.userProfile, (table) => {
		table.increments('user_profile_id').unsigned().primary();
		table.uuid('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(t.user).onDelete('CASCADE');
		table.string('username', 50).unique().notNullable();
		table.index('username');
		table.string('trail_name', 100).nullable();
		table.text('profile_photo_url').nullable();
		table.text('banner_photo_url').nullable();
		table.text('user_bio').nullable();
		table.string('user_location', 100).nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(t.socialLink);
	await knex.schema.dropTable(t.userProfile);
}
