import { Pool } from 'pg';

const NEON_DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fCiRrntQXE05@ep-crimson-resonance-az0bsitd-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// Declare global pool for hot-reloading in Next.js development
declare global {
  var postgresPool: Pool | undefined;
}

let pool: Pool;

if (!globalThis.postgresPool) {
  globalThis.postgresPool = new Pool({
    connectionString: NEON_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

pool = globalThis.postgresPool;

export default pool;
