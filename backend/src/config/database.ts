import { Pool, PoolConfig } from "pg";
import logger from "./logger";
import { env } from "./env";

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
};

const pool = new Pool(poolConfig);

pool.on("error", (error) => {
  logger.error({ err: error }, "Unexpected PostgreSQL error");
});

export { pool };
export const getClient = () => pool.connect();

export default pool;
