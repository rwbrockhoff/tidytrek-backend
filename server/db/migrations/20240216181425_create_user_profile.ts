import type { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(t.userProfile, (table) => {
		table.increments('user_profile_id').unsigned().primary();
		table.integer('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(t.user).onDelete('CASCADE');
		table.string('profile_photo_url').nullable();
		table.string('background_photo_url').nullable();
		table.text('user_bio').nullable();
		table.string('user_location').nullable();
		table.string('website_url').nullable();
		table.string('instagram_url').nullable();
		table.string('youtube_url').nullable();
		table.string('tiktok_url').nullable();
		table.string('facebook_url').nullable();
		table.string('twitter_url').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(t.userProfile);
}
