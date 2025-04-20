import { getServerDBInstance } from '@/database/server/connection';
import { LobeChatDatabase } from '@/database/type';
import { authedProcedure } from '@/libs/trpc';

/**
 * Middleware to add the database instance (`LobeChatDatabase`) to the tRPC context.
 */
export const dbMiddleware = authedProcedure.use(async (opts) => {
  const db = await getServerDBInstance();
  return opts.next({
    ctx: {
      ...opts.ctx,
      db: db as LobeChatDatabase,
    },
  });
}); 