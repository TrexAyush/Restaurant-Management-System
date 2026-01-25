import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('bills', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('order_id').notNullable().unique();
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('tax_amount', 10, 2).notNullable().defaultTo(0);
    table.decimal('total_amount', 10, 2).notNullable();
    table.enum('payment_method', ['cash', 'card', 'digital']).nullable();
    table.enum('payment_status', ['pending', 'paid', 'cancelled']).defaultTo('pending');
    table.timestamp('generated_at').defaultTo(knex.fn.now());
    table.timestamp('paid_at').nullable();
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('order_id').references('id').inTable('orders').onDelete('RESTRICT');
    
    // Indexes for performance
    table.index(['order_id']);
    table.index(['payment_status']);
    table.index(['payment_method']);
    table.index(['generated_at']);
    table.index(['paid_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('bills');
}