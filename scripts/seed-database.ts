#!/usr/bin/env ts-node

/**
 * Database seeding script for the Restaurant Management System
 * This script populates the database with comprehensive mock data
 */

import knex from 'knex';
import { config } from '../src/config/database';

async function seedDatabase() {
  const db = knex(config);
  
  try {
    console.log('🔌 Connecting to database...');
    await db.raw('SELECT 1');
    console.log('✅ Database connection established');

    console.log('🏗️ Running migrations...');
    await db.migrate.latest();
    console.log('✅ Migrations completed');

    console.log('🌱 Running seeds...');
    await db.seed.run({
      specific: '000_run_all_seeds.ts'
    });
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📝 Test Credentials:');
    console.log('   Admin: admin_test / password123');
    console.log('   Manager: manager_test / password123');
    console.log('   Waiter: waiter_test / password123');
    console.log('   Kitchen: kitchen_test / password123');
    console.log('   Cashier: cashier_test / password123');
    console.log('');
    console.log('🏪 Your restaurant now has:');
    console.log('   - 5 staff members with different roles');
    console.log('   - 8 menu categories with 32 menu items');
    console.log('   - 21 inventory items for ingredients');
    console.log('   - 16 tables with various capacities');
    console.log('   - Sample orders and bills for testing');
    console.log('');
    console.log('🚀 Ready to start your restaurant management system!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run the seeding
seedDatabase();