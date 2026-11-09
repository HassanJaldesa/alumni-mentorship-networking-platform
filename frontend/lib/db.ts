// Shared PostgreSQL connection pool for the Next.js server (IR-04).
// Only import this from server code (API routes), never from browser components.
import { Pool, type QueryResultRow } from "pg";

// Reuse one pool across hot reloads in development, instead of opening new connections each time.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

// Run a parameterized query and return its rows.
// Values are always passed separately ($1, $2, ...), never joined into the SQL string.
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}