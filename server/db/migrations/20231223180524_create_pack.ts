import type { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(t.pack, (table) => {
		table.increments('pack_id').unsigned().primary();
		table.uuid('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(t.user).onDelete('CASCADE');
		table.integer('pack_index').unsigned().notNullable();
		table.index('pack_index');
		table.string('pack_name').notNullable();
		table.text('pack_description').nullable();
		table.string('pack_location_tag').nullable();
		table.string('pack_duration_tag').nullable();
		table.string('pack_season_tag').nullable();
		table.string('pack_distance_tag').nullable();
		table.boolean('pack_public').defaultTo(false).notNullable();
		table.boolean('pack_affiliate').defaultTo(false).notNullable();
		table.boolean('pack_pricing').defaultTo(false).notNullable();
		table.text('pack_affiliate_description').nullable();
		table.string('pack_url_name').nullable();
		table.text('pack_url').nullable();
		table.text('pack_photo_url').nullable();
		table.integer('pack_views').defaultTo(0).notNullable();
		table.integer('pack_bookmark_count').defaultTo(0).notNullable();
		table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
		table.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(t.pack);
}
