import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add foreign key constraint for tables.current_order_id
  return knex.schema.alterTable('tables', (table) => {
    table.foreign('current_order_id').references('id').inTable('orders').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('tables', (table) => {
    table.dropForeign(['current_order_id']);
  });
}