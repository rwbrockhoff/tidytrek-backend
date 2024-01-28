import type { Knex } from 'knex';
const tableName = 'pack_categories';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
		table.increments('pack_category_id').unsigned().primary();
		table.integer('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable('users').onDelete('CASCADE');
		table.string('pack_id').unsigned().notNullable();
		table.foreign('pack_id').references('pack_id').inTable('packs');
		table.string('pack_category_name').notNullable();
		table.string('pack_category_color').nullable();
		table.integer('pack_category_index').unsigned().notNullable();
		table.index('pack_category_index');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(tableName);
}
