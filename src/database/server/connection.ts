import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import * as migrator from 'drizzle-orm/neon-serverless/migrator';
import { drizzle as nodeDrizzle } from 'drizzle-orm/node-postgres';
import * as nodeMigrator from 'drizzle-orm/node-postgres/migrator';
import { join } from 'node:path';
import { Pool as NodePool } from 'pg';
import ws from 'ws';

import { serverDBEnv } from '@/config/db';
import * as schema from '@/database/schemas';
import { LobeChatDatabase } from '@/database/type'; // Import the correct type

const migrationsFolder = join(__dirname, '../migrations');

let serverDBInstance: LobeChatDatabase | null = null;

export const getServerDBInstance = async (): Promise<LobeChatDatabase> => {
  // Return singleton instance if already created
  if (serverDBInstance) {
    return serverDBInstance;
  }

  const connectionString = serverDBEnv.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is not set. Server database connection cannot be established.');
    throw new Error('DATABASE_URL is not set correctly');
  }

  let db: LobeChatDatabase;

  if (serverDBEnv.DATABASE_DRIVER === 'node') {
    console.log('Using Node Postgres driver');
    const client = new NodePool({ connectionString });
    db = nodeDrizzle(client, { schema });
    // Consider running migrations only once during startup, not on every instance request
    // await nodeMigrator.migrate(db, { migrationsFolder });
  } else { // Default to 'neon'
    console.log('Using Neon Serverless driver');
    // https://github.com/neondatabase/serverless/blob/main/CONFIG.md#websocketconstructor-typeof-websocket--undefined
    neonConfig.webSocketConstructor = ws;
    const client = new NeonPool({ connectionString });
    db = neonDrizzle(client, { schema });
     // Consider running migrations only once during startup, not on every instance request
    // await migrator.migrate(db, { migrationsFolder });
  }

  serverDBInstance = db;
  return db;
};

// Optional: Function to run migrations separately, e.g., during build or startup
export const runServerMigrations = async () => {
   if (!serverDBInstance) {
     // Ensure instance is created before running migrations if called separately
     await getServerDBInstance();
   }
   if (!serverDBInstance) {
     throw new Error('Server DB instance could not be created for migrations.');
   }

   console.log('Running server migrations...');
   try {
      if (serverDBEnv.DATABASE_DRIVER === 'node') {
        await nodeMigrator.migrate(serverDBInstance, { migrationsFolder });
      } else {
        await migrator.migrate(serverDBInstance, { migrationsFolder });
      }
      console.log('Server migrations completed successfully.');
   } catch (error) {
     console.error('Error running server migrations:', error);
     throw error;
   }
}; 