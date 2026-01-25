import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Insert seed entries
  await knex('inventory_items').insert([
    // Proteins
    {
      id: uuidv4(),
      name: 'Chicken Breast',
      current_stock: 50.00,
      unit: 'lbs',
      low_stock_threshold: 10.00,
      cost_per_unit: 4.50,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Ground Beef',
      current_stock: 30.00,
      unit: 'lbs',
      low_stock_threshold: 8.00,
      cost_per_unit: 6.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Salmon Fillet',
      current_stock: 25.00,
      unit: 'lbs',
      low_stock_threshold: 5.00,
      cost_per_unit: 12.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Shrimp',
      current_stock: 15.00,
      unit: 'lbs',
      low_stock_threshold: 3.00,
      cost_per_unit: 8.50,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    // Vegetables
    {
      id: uuidv4(),
      name: 'Tomatoes',
      current_stock: 20.00,
      unit: 'lbs',
      low_stock_threshold: 5.00,
      cost_per_unit: 2.50,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Lettuce',
      current_stock: 15.00,
      unit: 'heads',
      low_stock_threshold: 5.00,
      cost_per_unit: 1.50,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Onions',
      current_stock: 25.00,
      unit: 'lbs',
      low_stock_threshold: 8.00,
      cost_per_unit: 1.25,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Bell Peppers',
      current_stock: 12.00,
      unit: 'lbs',
      low_stock_threshold: 3.00,
      cost_per_unit: 3.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    // Dairy & Eggs
    {
      id: uuidv4(),
      name: 'Mozzarella Cheese',
      current_stock: 10.00,
      unit: 'lbs',
      low_stock_threshold: 2.00,
      cost_per_unit: 5.50,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Eggs',
      current_stock: 120.00,
      unit: 'pieces',
      low_stock_threshold: 24.00,
      cost_per_unit: 0.25,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Heavy Cream',
      current_stock: 8.00,
      unit: 'quarts',
      low_stock_threshold: 2.00,
      cost_per_unit: 3.50,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    // Grains & Pasta
    {
      id: uuidv4(),
      name: 'Pasta - Spaghetti',
      current_stock: 20.00,
      unit: 'lbs',
      low_stock_threshold: 5.00,
      cost_per_unit: 1.50,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Rice',
      current_stock: 50.00,
      unit: 'lbs',
      low_stock_threshold: 10.00,
      cost_per_unit: 1.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Flour',
      current_stock: 25.00,
      unit: 'lbs',
      low_stock_threshold: 5.00,
      cost_per_unit: 0.75,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    // Seasonings & Oils
    {
      id: uuidv4(),
      name: 'Olive Oil',
      current_stock: 5.00,
      unit: 'liters',
      low_stock_threshold: 1.00,
      cost_per_unit: 8.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Salt',
      current_stock: 10.00,
      unit: 'lbs',
      low_stock_threshold: 2.00,
      cost_per_unit: 1.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Black Pepper',
      current_stock: 2.00,
      unit: 'lbs',
      low_stock_threshold: 0.50,
      cost_per_unit: 12.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    // Beverages
    {
      id: uuidv4(),
      name: 'Coffee Beans',
      current_stock: 10.00,
      unit: 'lbs',
      low_stock_threshold: 2.00,
      cost_per_unit: 8.50,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Orange Juice',
      current_stock: 12.00,
      unit: 'liters',
      low_stock_threshold: 3.00,
      cost_per_unit: 4.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    // Dessert Ingredients
    {
      id: uuidv4(),
      name: 'Sugar',
      current_stock: 20.00,
      unit: 'lbs',
      low_stock_threshold: 5.00,
      cost_per_unit: 1.50,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Vanilla Extract',
      current_stock: 2.00,
      unit: 'liters',
      low_stock_threshold: 0.50,
      cost_per_unit: 25.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}