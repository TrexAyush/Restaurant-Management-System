import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('menu_item_ingredients', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('menu_item_id').notNullable();
    table.uuid('inventory_item_id').notNullable();
    table.decimal('quantity', 10, 3).notNullable();
    table.string('unit', 50).notNullable();
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('menu_item_id').references('id').inTable('menu_items').onDelete('CASCADE');
    table.foreign('inventory_item_id').references('id').inTable('inventory_items').onDelete('RESTRICT');
    
    // Unique constraint to prevent duplicate ingredient entries for same menu item
    table.unique(['menu_item_id', 'inventory_item_id']);
    
    // Indexes for performance
    table.index(['menu_item_id']);
    table.index(['inventory_item_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('menu_item_ingredients');
}