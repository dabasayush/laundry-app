import knex, { Knex } from "knex";
import { knexConfig } from "./knexfile";

export const db: Knex = knex(knexConfig);

export async function testDbConnection(): Promise<void> {
  await db.raw("SELECT 1");
}
