import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('table_id').notNullable();
    table.uuid('waiter_id').notNullable();
    table.enum('status', ['placed', 'preparing', 'ready', 'served']).defaultTo('placed');
    table.decimal('total_amount', 10, 2).notNullable().defaultTo(0);
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('table_id').references('id').inTable('tables').onDelete('RESTRICT');
    table.foreign('waiter_id').references('id').inTable('users').onDelete('RESTRICT');
    
    // Indexes for performance
    table.index(['table_id']);
    table.index(['waiter_id']);
    table.index(['status']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('orders');
}