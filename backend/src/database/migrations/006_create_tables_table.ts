import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tables', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('number').notNullable().unique();
    table.integer('capacity').notNullable();
    table.enum('status', ['available', 'occupied', 'reserved', 'out_of_service']).defaultTo('available');
    table.uuid('current_order_id').nullable();
    table.timestamp('occupied_at').nullable();
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['number']);
    table.index(['status']);
    table.index(['capacity']);
    table.index(['current_order_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('tables');
}