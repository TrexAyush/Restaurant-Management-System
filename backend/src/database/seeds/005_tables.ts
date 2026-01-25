import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { TableStatus } from '../../models/enums';

export async function seed(knex: Knex): Promise<void> {
  // Insert seed entries
  await knex('tables').insert([
    // Small tables (2 people)
    {
      id: uuidv4(),
      number: 1,
      capacity: 2,
      status: TableStatus.AVAILABLE,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      number: 2,
      capacity: 2,
      status: TableStatus.AVAILABLE,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      number: 3,
      capacity: 2,
      status: TableStatus.OCCUPIED,
      current_order_id: null, // Will be set when orders are created
      occupied_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      number: 4,
      capacity: 2,
      status: TableStatus.AVAILABLE,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },

    // Medium tables (4 people)
    {
      id: uuidv4(),
      number: 5,
      capacity: 4,
      status: TableStatus.AVAILABLE,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      number: 6,
      capacity: 4,
      status: TableStatus.OCCUPIED,
      current_order_id: null, // Will be set when orders are created
      occupied_at: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      number: 7,
      capacity: 4,
      status: TableStatus.RESERVED,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      number: 8,
      capacity: 4,
      status: TableStatus.AVAILABLE,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      number: 9,
      capacity: 4,
      status: TableStatus.AVAILABLE,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      number: 10,
      capacity: 4,
      status: TableStatus.OCCUPIED,
      current_order_id: null, // Will be set when orders are created
      occupied_at: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      created_at: new Date(),
      updated_at: new Date()
    },

    // Large tables (6 people)
    {
      id: uuidv4(),
      number: 11,
      capacity: 6,
      status: TableStatus.AVAILABLE,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      number: 12,
      capacity: 6,
      status: TableStatus.AVAILABLE,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      number: 13,
      capacity: 6,
      status: TableStatus.RESERVED,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },

    // Extra large tables (8 people)
    {
      id: uuidv4(),
      number: 14,
      capacity: 8,
      status: TableStatus.AVAILABLE,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      number: 15,
      capacity: 8,
      status: TableStatus.AVAILABLE,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    },

    // One table out of service for maintenance
    {
      id: uuidv4(),
      number: 16,
      capacity: 4,
      status: TableStatus.OUT_OF_SERVICE,
      current_order_id: null,
      occupied_at: null,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}