import * as dotenv from 'dotenv';
import { migrate as neonMigrate } from 'drizzle-orm/neon-serverless/migrator';
import { migrate as nodeMigrate } from 'drizzle-orm/node-postgres/migrator';
import { join } from 'node:path';

import { serverDBEnv } from '@/config/db';
import { DB_MIGRATIONS_DIR } from '@/const/db';
import { getServerDBInstance } from '@/database/server/connection';
import { DB_FAIL_INIT_HINT, PGVECTOR_HINT } from './errorHint';

// Read the `.env` file if it exists, or a file specified by the
// dotenv_config_path parameter that's passed to Node.js
dotenv.config();

const migrationsFolder = join(process.cwd(), DB_MIGRATIONS_DIR);

const migrateDB = async () => {
  console.log('Migrating database...');

  const db = await getServerDBInstance(); // Get the correct instance

  if (serverDBEnv.DATABASE_DRIVER === 'node') {
    // @ts-ignore
    await nodeMigrate(db, { migrationsFolder });
  } else {
    // @ts-ignore
    await neonMigrate(db, { migrationsFolder });
  }

  console.log('Database migrated successfully.');
};

let connectionString = process.env.DATABASE_URL;

// only migrate database if the connection string is available
if (connectionString) {
  // eslint-disable-next-line unicorn/prefer-top-level-await
  migrateDB().catch((err) => {
    console.error('❌ Database migrate failed:', err);

    const errMsg = err.message as string;

    if (errMsg.includes('extension "vector" is not available')) {
      console.info(PGVECTOR_HINT);
    } else if (errMsg.includes(`Cannot read properties of undefined (reading 'migrate')`)) {
      console.info(DB_FAIL_INIT_HINT);
    }

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  });
} else {
  console.log('🟢 not find database env, migration skipped');
}
