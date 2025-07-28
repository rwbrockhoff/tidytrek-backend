import type { Knex } from 'knex';
import { Tables } from '../tables.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(Tables.SocialLink, (table) => {
		table.increments('social_link_id').unsigned().primary();
		table.uuid('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(Tables.User).onDelete('CASCADE');
		table.text('social_link_url').notNullable();
		table.integer('social_link_clicks').defaultTo(0).notNullable();
		table.index('user_id');
	});

	await knex.schema.createTable(Tables.UserProfile, (table) => {
		table.increments('user_profile_id').unsigned().primary();
		table.uuid('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(Tables.User).onDelete('CASCADE');
		table.string('username', 50).unique().notNullable();
		table.index('username');
		table.string('trail_name', 100).nullable();
		table.text('profile_photo_url').nullable();
		table.string('profile_photo_s3_key', 500).nullable();
		table.json('profile_photo_position').nullable();
		table.text('banner_photo_url').nullable();
		table.string('banner_photo_s3_key', 500).nullable();
		table.json('banner_photo_position').nullable();
		table.text('user_bio').nullable();
		table.string('user_location', 100).nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(Tables.SocialLink);
	await knex.schema.dropTable(Tables.UserProfile);
}
