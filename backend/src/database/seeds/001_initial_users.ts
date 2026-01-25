import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../../models/enums';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Hash password for all test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Insert seed entries
  await knex('users').insert([
    {
      id: uuidv4(),
      username: 'admin_test',
      password_hash: hashedPassword,
      role: UserRole.ADMIN,
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@test.com',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      username: 'manager_test',
      password_hash: hashedPassword,
      role: UserRole.MANAGER,
      first_name: 'Manager',
      last_name: 'User',
      email: 'manager@test.com',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      username: 'waiter_test',
      password_hash: hashedPassword,
      role: UserRole.WAITER,
      first_name: 'Waiter',
      last_name: 'User',
      email: 'waiter@test.com',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      username: 'kitchen_test',
      password_hash: hashedPassword,
      role: UserRole.KITCHEN_STAFF,
      first_name: 'Kitchen',
      last_name: 'Staff',
      email: 'kitchen@test.com',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      username: 'cashier_test',
      password_hash: hashedPassword,
      role: UserRole.CASHIER,
      first_name: 'Cashier',
      last_name: 'User',
      email: 'cashier@test.com',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}