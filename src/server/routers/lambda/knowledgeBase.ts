import { z } from 'zod';

import { KnowledgeBaseModel } from '@/database/models/knowledgeBase';
import { getServerDBInstance } from '@/database/server/connection';
import { authedProcedure, router } from '@/libs/trpc';
import { KnowledgeBaseItem } from '@/types/knowledgeBase';

const knowledgeBaseProcedure = authedProcedure.use(async (opts) => {
  const db = await getServerDBInstance();
  return opts.next({
    ctx: {
      knowledgeBaseModel: new KnowledgeBaseModel(db, opts.ctx.userId),
    },
  });
});

export const knowledgeBaseRouter = router({
  addFilesToKnowledgeBase: knowledgeBaseProcedure
    .input(z.object({ ids: z.array(z.string()), knowledgeBaseId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.knowledgeBaseModel.addFilesToKnowledgeBase(input.knowledgeBaseId, input.ids);
    }),

  createKnowledgeBase: knowledgeBaseProcedure
    .input(z.object({
      avatar: z.string().nullish(),
      description: z.string().nullish(),
      name: z.string().optional(),
      isPublic: z.boolean().nullish(),
      settings: z.any().optional(),
      type: z.string().nullish(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.knowledgeBaseModel.create(input);
    }),

  deleteKnowledgeBase: knowledgeBaseProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.knowledgeBaseModel.delete(input.id);
    }),

  getAllKnowledgeBases: knowledgeBaseProcedure.query(async ({ ctx }) => {
    return ctx.knowledgeBaseModel.query();
  }),

  getKnowledgeBaseById: knowledgeBaseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<KnowledgeBaseItem | undefined> => {
      return ctx.knowledgeBaseModel.findById(input.id);
    }),

  removeAllKnowledgeBases: knowledgeBaseProcedure.mutation(async ({ ctx }) => {
    return ctx.knowledgeBaseModel.deleteAll();
  }),

  removeFilesFromKnowledgeBase: knowledgeBaseProcedure
    .input(z.object({ ids: z.array(z.string()), knowledgeBaseId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.knowledgeBaseModel.removeFilesFromKnowledgeBase(input.knowledgeBaseId, input.ids);
    }),

  updateKnowledgeBase: knowledgeBaseProcedure
    .input(
      z.object({
        id: z.string(),
        value: z
          .object({
            avatar: z.string().nullish(),
            description: z.string().nullish(),
            name: z.string().optional(),
            isPublic: z.boolean().nullish(),
            settings: z.any().optional(),
            type: z.string().nullish(),
          })
          .partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.knowledgeBaseModel.update(input.id, input.value);
    }),
});

export type KnowledgeBaseRouter = typeof knowledgeBaseRouter;
