import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('menu_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 200).notNullable();
    table.text('description');
    table.decimal('price', 10, 2).notNullable();
    table.uuid('category_id').notNullable();
    table.boolean('is_available').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('category_id').references('id').inTable('menu_categories').onDelete('RESTRICT');
    
    // Indexes for performance
    table.index(['name']);
    table.index(['category_id']);
    table.index(['is_available']);
    table.index(['price']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('menu_items');
}