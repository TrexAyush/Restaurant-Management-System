import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Insert seed entries
  await knex('inventory_items').insert([
    // Proteins
    {
      id: uuidv4(),
      name: 'Chicken',
      current_stock: 50.00,
      unit: 'kg',
      low_stock_threshold: 10.00,
      cost_per_unit: 220.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Mutton',
      current_stock: 25.00,
      unit: 'kg',
      low_stock_threshold: 5.00,
      cost_per_unit: 650.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Prawns',
      current_stock: 15.00,
      unit: 'kg',
      low_stock_threshold: 3.00,
      cost_per_unit: 500.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Paneer',
      current_stock: 20.00,
      unit: 'kg',
      low_stock_threshold: 5.00,
      cost_per_unit: 320.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    // Vegetables & Greens
    {
      id: uuidv4(),
      name: 'Tomatoes',
      current_stock: 30.00,
      unit: 'kg',
      low_stock_threshold: 8.00,
      cost_per_unit: 40.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Onions',
      current_stock: 40.00,
      unit: 'kg',
      low_stock_threshold: 10.00,
      cost_per_unit: 35.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Potatoes',
      current_stock: 35.00,
      unit: 'kg',
      low_stock_threshold: 10.00,
      cost_per_unit: 30.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Green Chillies',
      current_stock: 5.00,
      unit: 'kg',
      low_stock_threshold: 1.00,
      cost_per_unit: 80.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Capsicum',
      current_stock: 10.00,
      unit: 'kg',
      low_stock_threshold: 3.00,
      cost_per_unit: 60.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    // Dairy
    {
      id: uuidv4(),
      name: 'Curd / Yoghurt',
      current_stock: 20.00,
      unit: 'kg',
      low_stock_threshold: 5.00,
      cost_per_unit: 60.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Cream',
      current_stock: 10.00,
      unit: 'liters',
      low_stock_threshold: 2.00,
      cost_per_unit: 200.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Ghee',
      current_stock: 10.00,
      unit: 'kg',
      low_stock_threshold: 2.00,
      cost_per_unit: 550.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    // Grains & Flour
    {
      id: uuidv4(),
      name: 'Basmati Rice',
      current_stock: 50.00,
      unit: 'kg',
      low_stock_threshold: 10.00,
      cost_per_unit: 120.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Atta (Wheat Flour)',
      current_stock: 30.00,
      unit: 'kg',
      low_stock_threshold: 8.00,
      cost_per_unit: 45.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Maida (Refined Flour)',
      current_stock: 15.00,
      unit: 'kg',
      low_stock_threshold: 3.00,
      cost_per_unit: 40.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    // Spices & Oils
    {
      id: uuidv4(),
      name: 'Cooking Oil',
      current_stock: 20.00,
      unit: 'liters',
      low_stock_threshold: 5.00,
      cost_per_unit: 150.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Garam Masala',
      current_stock: 5.00,
      unit: 'kg',
      low_stock_threshold: 1.00,
      cost_per_unit: 400.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Red Chilli Powder',
      current_stock: 5.00,
      unit: 'kg',
      low_stock_threshold: 1.00,
      cost_per_unit: 300.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Turmeric Powder',
      current_stock: 3.00,
      unit: 'kg',
      low_stock_threshold: 0.50,
      cost_per_unit: 250.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Salt',
      current_stock: 10.00,
      unit: 'kg',
      low_stock_threshold: 2.00,
      cost_per_unit: 20.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    // Beverages
    {
      id: uuidv4(),
      name: 'Tea Leaves',
      current_stock: 5.00,
      unit: 'kg',
      low_stock_threshold: 1.00,
      cost_per_unit: 400.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Milk',
      current_stock: 30.00,
      unit: 'liters',
      low_stock_threshold: 10.00,
      cost_per_unit: 55.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    // Dessert
    {
      id: uuidv4(),
      name: 'Sugar',
      current_stock: 20.00,
      unit: 'kg',
      low_stock_threshold: 5.00,
      cost_per_unit: 45.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Saffron',
      current_stock: 0.10,
      unit: 'kg',
      low_stock_threshold: 0.02,
      cost_per_unit: 250000.00,
      supplier_id: null,
      last_restocked: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}