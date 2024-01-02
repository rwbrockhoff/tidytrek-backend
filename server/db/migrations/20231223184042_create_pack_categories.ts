import type { Knex } from "knex";
const tableName = "pack_categories";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.increments("pack_category_id").unsigned().primary();
    table.integer("user_id").unsigned().notNullable();
    table
      .foreign("user_id")
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");
    table.integer("pack_id").unsigned().notNullable();
    table.foreign("pack_id").references("pack_id").inTable("packs");
    table.string("pack_category_name").notNullable();
    table.text("pack_category_description").nullable();
    table
      .increments("pack_category_index", { primaryKey: false })
      .notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}
