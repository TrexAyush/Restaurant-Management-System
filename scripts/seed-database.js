#!/usr/bin/env node

/**
 * Database seeding script for the Restaurant Management System
 * This script populates the database with comprehensive mock data
 */

const knex = require('knex');
const path = require('path');
require('dotenv').config();

// Register ts-node for TypeScript support
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

// Database configuration
const config = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    database: process.env.DB_NAME || 'restaurant_management'
  },
  migrations: {
    directory: path.join(__dirname, '../src/database/migrations'),
    extension: 'ts'
  },
  seeds: {
    directory: path.join(__dirname, '../src/database/seeds'),
    extension: 'ts'
  }
};

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