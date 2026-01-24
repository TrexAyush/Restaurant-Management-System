import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Insert seed entries
  await knex('menu_categories').insert([
    {
      id: uuidv4(),
      name: 'Appetizers',
      description: 'Start your meal with our delicious appetizers',
      sort_order: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Soups & Salads',
      description: 'Fresh soups and crisp salads',
      sort_order: 2,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Main Courses',
      description: 'Hearty main dishes to satisfy your appetite',
      sort_order: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Pasta & Pizza',
      description: 'Italian classics made fresh daily',
      sort_order: 4,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Seafood',
      description: 'Fresh catch of the day and seafood specialties',
      sort_order: 5,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Desserts',
      description: 'Sweet endings to your perfect meal',
      sort_order: 6,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Beverages',
      description: 'Refreshing drinks and specialty beverages',
      sort_order: 7,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Kids Menu',
      description: 'Special dishes for our younger guests',
      sort_order: 8,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}