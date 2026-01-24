import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('order_id').notNullable();
    table.uuid('menu_item_id').notNullable();
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.text('special_instructions').nullable();
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('order_id').references('id').inTable('orders').onDelete('CASCADE');
    table.foreign('menu_item_id').references('id').inTable('menu_items').onDelete('RESTRICT');
    
    // Indexes for performance
    table.index(['order_id']);
    table.index(['menu_item_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('order_items');
}