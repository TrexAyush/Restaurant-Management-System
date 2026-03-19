import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Fresh start — no orders
  console.log('No initial orders — fresh restaurant setup');
}
