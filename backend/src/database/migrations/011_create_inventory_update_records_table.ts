import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('inventory_update_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('inventory_item_id').notNullable();
    table.decimal('previous_stock', 10, 3).notNullable();
    table.decimal('new_stock', 10, 3).notNullable();
    table.decimal('change_amount', 10, 3).notNullable();
    table.string('change_reason', 500).notNullable();
    table.string('updated_by', 255).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign key constraint
    table.foreign('inventory_item_id').references('id').inTable('inventory_items').onDelete('CASCADE');
    
    // Indexes for performance
    table.index(['inventory_item_id']);
    table.index(['created_at']);
    table.index(['updated_by']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('inventory_update_records');
}