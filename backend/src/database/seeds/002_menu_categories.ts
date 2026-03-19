import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Insert seed entries
  await knex('menu_categories').insert([
    {
      id: uuidv4(),
      name: 'Starters',
      description: 'Crispy snacks and chaats to kick off your meal',
      sort_order: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Tandoor & Kebabs',
      description: 'Smoky clay-oven grilled specialties',
      sort_order: 2,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Main Course - Veg',
      description: 'Rich vegetarian curries and gravies',
      sort_order: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Main Course - Non Veg',
      description: 'Flavourful chicken, mutton and seafood curries',
      sort_order: 4,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Biryani & Rice',
      description: 'Fragrant dum-cooked biryanis and rice preparations',
      sort_order: 5,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Breads',
      description: 'Fresh tandoori rotis, naans and parathas',
      sort_order: 6,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Desserts',
      description: 'Traditional Indian sweets and mithai',
      sort_order: 7,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Beverages',
      description: 'Refreshing lassis, chaas and chai',
      sort_order: 8,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}