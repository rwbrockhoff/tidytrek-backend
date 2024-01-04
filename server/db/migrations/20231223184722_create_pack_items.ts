import type { Knex } from "knex";
const tableName = "pack_items";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.increments("pack_item_id").unsigned().primary();
    table.integer("user_id").unsigned().notNullable();
    table
      .foreign("user_id")
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");
    table.integer("pack_id").unsigned();
    table.foreign("pack_id").references("pack_id").inTable("packs");

    table.integer("pack_category_id").unsigned();
    table
      .foreign("pack_category_id")
      .references("pack_category_id")
      .inTable("pack_categories");
    table.increments("pack_item_index", { primaryKey: false }).notNullable();
    table.string("pack_item_name").notNullable();
    table.text("pack_item_description").nullable();
    table.integer("pack_item_quantity").defaultTo(1).notNullable();
    table.bigint("pack_item_weight").nullable().defaultTo(0);
    table.string("pack_item_unit").notNullable().defaultTo("oz");
    table.bigint("pack_item_price").nullable().defaultTo(0);
    table.string("pack_item_url").nullable();
    table.boolean("worn_weight").defaultTo(false).notNullable();
    table.boolean("consumable").defaultTo(false).notNullable();
    table.boolean("favorite").defaultTo(false).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").nullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}
