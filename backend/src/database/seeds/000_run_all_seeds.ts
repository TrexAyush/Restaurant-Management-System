import { Knex } from 'knex';

/**
 * Master seed file that runs all seeds in the correct order
 * This ensures proper foreign key relationships are maintained
 */
export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // First, clean up existing data in reverse dependency order
    console.log('🧹 Cleaning existing data...');
    await knex('bills').del();
    await knex('order_items').del();
    await knex('orders').del();
    await knex('menu_item_ingredients').del();
    await knex('menu_items').del();
    await knex('menu_categories').del();
    await knex('inventory_items').del();
    await knex('tables').del();
    await knex('users').del();

    // 1. Users (no dependencies)
    console.log('👥 Seeding users...');
    await require('./001_initial_users').seed(knex);

    // 2. Menu Categories (no dependencies)
    console.log('📂 Seeding menu categories...');
    await require('./002_menu_categories').seed(knex);

    // 3. Inventory Items (no dependencies)
    console.log('📦 Seeding inventory items...');
    await require('./003_inventory_items').seed(knex);

    // 4. Menu Items (depends on categories)
    console.log('🍽️ Seeding menu items...');
    await require('./004_menu_items').seed(knex);

    // 5. Menu Item Ingredients (depends on menu items and inventory items)
    console.log('🥘 Seeding menu item ingredients...');
    await require('./008_menu_item_ingredients').seed(knex);

    // 6. Tables (no dependencies)
    console.log('🪑 Seeding tables...');
    await require('./005_tables').seed(knex);

    // 7. Orders (depends on tables, users, menu items)
    console.log('📋 Seeding orders...');
    await require('./006_orders').seed(knex);

    // 8. Bills (depends on orders)
    console.log('💰 Seeding bills...');
    await require('./007_bills').seed(knex);

    console.log('✅ Database seeding completed successfully!');
    console.log('📊 Summary:');
    
    // Print summary statistics
    const stats = await Promise.all([
      knex('users').count('* as count'),
      knex('menu_categories').count('* as count'),
      knex('inventory_items').count('* as count'),
      knex('menu_items').count('* as count'),
      knex('menu_item_ingredients').count('* as count'),
      knex('tables').count('* as count'),
      knex('orders').count('* as count'),
      knex('order_items').count('* as count'),
      knex('bills').count('* as count')
    ]);

    console.log(`   - Users: ${(stats[0][0] as any)?.count || 0}`);
    console.log(`   - Menu Categories: ${(stats[1][0] as any)?.count || 0}`);
    console.log(`   - Inventory Items: ${(stats[2][0] as any)?.count || 0}`);
    console.log(`   - Menu Items: ${(stats[3][0] as any)?.count || 0}`);
    console.log(`   - Menu Item Ingredients: ${(stats[4][0] as any)?.count || 0}`);
    console.log(`   - Tables: ${(stats[5][0] as any)?.count || 0}`);
    console.log(`   - Orders: ${(stats[6][0] as any)?.count || 0}`);
    console.log(`   - Order Items: ${(stats[7][0] as any)?.count || 0}`);
    console.log(`   - Bills: ${(stats[8][0] as any)?.count || 0}`);

  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}