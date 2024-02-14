import type { Knex } from 'knex';

const tableName = 'theme_colors';
const colorNameConstraints = [
	'primary',
	'first',
	'second',
	'third',
	'fourth',
	'fifth',
	'sixth',
	'seventh',
];

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
		table.increments('theme_color_id').unsigned().primary();
		table.integer('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable('users').onDelete('CASCADE');
		table.integer('theme_id').unsigned();
		table.foreign('theme_id').references('theme_id').inTable('themes');
		table.string('theme_color_name').checkIn(colorNameConstraints).notNullable();
		table.string('theme_color').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(tableName);
}
