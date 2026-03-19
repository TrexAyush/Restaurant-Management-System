import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Fresh start — no bills
  console.log('No initial bills — fresh restaurant setup');
}
