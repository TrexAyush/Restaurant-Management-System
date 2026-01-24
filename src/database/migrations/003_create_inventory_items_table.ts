import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('inventory_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 200).notNullable();
    table.decimal('current_stock', 10, 3).notNullable().defaultTo(0);
    table.string('unit', 50).notNullable();
    table.decimal('low_stock_threshold', 10, 3).notNullable().defaultTo(0);
    table.decimal('cost_per_unit', 10, 2).notNullable().defaultTo(0);
    table.string('supplier_id', 255);
    table.timestamp('last_restocked').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['name']);
    table.index(['current_stock']);
    table.index(['low_stock_threshold']);
    table.index(['last_restocked']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('inventory_items');
}