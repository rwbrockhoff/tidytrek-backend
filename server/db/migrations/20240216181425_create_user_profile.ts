import type { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(t.socialLinkList, (table) => {
		table.increments('social_link_list_id').unsigned().primary();
		table.string('social_link_name').unique().notNullable();
	});

	await knex.schema.createTable(t.socialLink, (table) => {
		table.increments('social_link_id').unsigned().primary();

		table.integer('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(t.user).onDelete('CASCADE');

		table.integer('social_link_list_id').unsigned().notNullable();
		table
			.foreign('social_link_list_id')
			.references('social_link_list_id')
			.inTable(t.socialLinkList);

		table.string('social_link_url').notNullable();
	});

	await knex.schema.createTable(t.userProfile, (table) => {
		table.increments('user_profile_id').unsigned().primary();
		table.integer('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(t.user).onDelete('CASCADE');
		table.string('profile_photo_url').nullable();
		table.string('background_photo_url').nullable();
		table.text('user_bio').nullable();
		table.string('user_location').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(t.socialLink);
	await knex.schema.dropTable(t.socialLinkList);
	await knex.schema.dropTable(t.userProfile);
}
