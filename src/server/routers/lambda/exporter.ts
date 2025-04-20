import { z } from 'zod';

import { MessageModel } from '@/database/models/message';
import { SessionModel } from '@/database/models/session';
import { TopicModel } from '@/database/models/topic';
import { authedProcedure, router } from '@/libs/trpc';
import { dbMiddleware } from '@/libs/trpc/middleware/db';
import { DrizzleMigrationModel } from '@/database/models/drizzleMigration';
import { DataExporterRepos } from '@/database/repositories/dataExporter';
import { ExportDatabaseData } from '@/types/export';

const exporterProcedure = authedProcedure.use(dbMiddleware).use(async (opts) => {
  const messageModel = new MessageModel(opts.ctx.db, opts.ctx.userId);
  const topicModel = new TopicModel(opts.ctx.db, opts.ctx.userId);
  const sessionModel = new SessionModel(opts.ctx.db, opts.ctx.userId);
  const dataExporterRepos = new DataExporterRepos(opts.ctx.db, opts.ctx.userId);
  const drizzleMigration = new DrizzleMigrationModel(opts.ctx.db);

  return opts.next({
    ctx: {
      ...opts.ctx,
      messageModel,
      sessionModel,
      topicModel,
      dataExporterRepos,
      drizzleMigration,
    },
  });
});

export const exporterRouter = router({
  exportAllData: exporterProcedure
    .mutation(async ({ ctx }) => {
      const messages = await ctx.messageModel.queryAll();
      const sessions = await ctx.sessionModel.query();
      const topics = await ctx.topicModel.queryAll();

      return { messages, sessions, topics };
    }),

  exportMessages: exporterProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      return ctx.messageModel.findByIds(input.ids);
    }),

  exportSessions: exporterProcedure
    .mutation(async ({ ctx }) => {
      const data = await ctx.sessionModel.query();

      return { data };
    }),

  exportAll: exporterProcedure.mutation(async ({ ctx }): Promise<ExportDatabaseData> => {
    const data = await ctx.dataExporterRepos.export();
    const schemaHash = await ctx.drizzleMigration.getLatestMigrationHash();
    return { data, schemaHash };
  }),

  exportData: exporterProcedure.mutation(async ({ ctx }): Promise<ExportDatabaseData> => {
    const data = await ctx.dataExporterRepos.export(5);
    const schemaHash = await ctx.drizzleMigration.getLatestMigrationHash();
    return { data, schemaHash };
  }),

  getMigrations: exporterProcedure.query(async ({ ctx }) => {
    return ctx.drizzleMigration.getMigrationList();
  }),
});

export type ExporterRouter = typeof exporterRouter;
