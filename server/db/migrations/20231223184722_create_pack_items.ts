import type { Knex } from 'knex';
import { Tables } from '../tables.js';
import { WeightUnit, WEIGHT_UNIT_VALUES } from '../../types/units.js';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(Tables.PackItem, (table) => {
		table.increments('pack_item_id').unsigned().primary();
		table.uuid('user_id').unsigned().notNullable();
		table.foreign('user_id').references('user_id').inTable(Tables.User).onDelete('CASCADE');
		table.integer('pack_id').unsigned().nullable();
		table.foreign('pack_id').references('pack_id').inTable(Tables.Pack).onDelete('CASCADE');

		table.integer('pack_category_id').unsigned().nullable();
		table
			.foreign('pack_category_id')
			.references('pack_category_id')
			.inTable(Tables.PackCategory)
			.onDelete('CASCADE');
		table.string('pack_item_index', 20).notNullable().defaultTo('0');
		table.index('pack_item_index');
		table.string('pack_item_name', 100).notNullable();
		table.text('pack_item_description').nullable();
		table.integer('pack_item_quantity').defaultTo(1).notNullable();
		table.decimal('pack_item_weight').nullable().defaultTo(0);
		table.string('pack_item_weight_unit', 10)
			.notNullable()
			.defaultTo(WeightUnit.oz)
			.checkIn(WEIGHT_UNIT_VALUES);
		table.decimal('pack_item_price', 10, 4).nullable().defaultTo(0);
		table.text('pack_item_url').nullable();
		table.integer('pack_item_link_clicks').defaultTo(0).notNullable();
		table.boolean('worn_weight').defaultTo(false).notNullable();
		table.boolean('consumable').defaultTo(false).notNullable();
		table.boolean('favorite').defaultTo(false).notNullable();
		table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
		table.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
		table.index(['pack_id', 'pack_category_id']);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(Tables.PackItem);
}
