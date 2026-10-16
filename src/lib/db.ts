import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { parseEnv } from "@neon/env";
import config from "../../neon";

// DATABASE_URL is the pooled connection, meant for normal app traffic.
// DATABASE_URL_UNPOOLED is reserved for migrations.
const { postgres } = parseEnv(config, ["DATABASE_URL"]);

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ?? new Pool({ connectionString: postgres.databaseUrl });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

// Lets Vercel close idle connections before the function instance is suspended.
attachDatabasePool(pool);
