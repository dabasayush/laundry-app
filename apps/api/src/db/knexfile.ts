import type { Knex } from "knex";

export const knexConfig: Knex.Config = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: {
    min: Number(process.env.DB_POOL_MIN ?? 2),
    max: Number(process.env.DB_POOL_MAX ?? 20),
  },
  migrations: {
    directory: "./migrations",
    extension: "ts",
  },
  seeds: {
    directory: "./seeds",
    extension: "ts",
  },
};

export default knexConfig;
