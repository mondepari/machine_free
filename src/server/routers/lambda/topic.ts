import { z } from 'zod';

import { TopicModel } from '@/database/models/topic';
import { getServerDBInstance } from '@/database/server/connection';
import { authedProcedure, publicProcedure, router } from '@/libs/trpc';
import { BatchTaskResult } from '@/types/service';
import { dbMiddleware } from '@/libs/trpc/middleware/db';
// import { CreateTopicSchema, UpdateTopicSchema } from '@/types/topic'; // Commented out

const topicProcedure = dbMiddleware.use(async (opts) => {
  return opts.next({
    ctx: {
      ...opts.ctx,
      topicModel: new TopicModel(opts.ctx.db, opts.ctx.userId),
    },
  });
});

export const topicRouter = router({
  batchCreateTopics: topicProcedure
    .input(
      z.array(
        z.object({
          favorite: z.boolean().optional(),
          id: z.string().optional(),
          messages: z.array(z.string()).optional(),
          sessionId: z.string().optional(),
          title: z.string(),
        }),
      ),
    )
    .mutation(async ({ input, ctx }): Promise<BatchTaskResult> => {
      const data = await ctx.topicModel.batchCreate(
        input.map((item) => ({
          ...item,
        })) as any,
      );

      return { added: data.length, ids: [], skips: [], success: true };
    }),

  batchDelete: topicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      return ctx.topicModel.batchDelete(input.ids);
    }),

  batchDeleteBySessionId: topicProcedure
    .input(z.object({ id: z.string().nullable().optional() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.topicModel.batchDeleteBySessionId(input.id);
    }),

  cloneTopic: topicProcedure
    .input(z.object({ id: z.string(), newTitle: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const data = await ctx.topicModel.duplicate(input.id, input.newTitle);

      return data.topic.id;
    }),

  countTopics: topicProcedure
    .input(
      z
        .object({
          endDate: z.string().optional(),
          range: z.tuple([z.string(), z.string()]).optional(),
          startDate: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.topicModel.count(input);
    }),

  // createTopic: topicProcedure // Commented out
  //   .input(CreateTopicSchema)
  //   .mutation(async ({ ctx, input }) => {
  //     return ctx.topicModel.create(input);
  //   }),

  getAllTopics: topicProcedure.query(async ({ ctx }) => {
    return ctx.topicModel.queryAll();
  }),

  // TODO: this procedure should be used with authedProcedure
  getTopics: publicProcedure
    .input(
      z.object({
        favorite: z.boolean().optional(),
        keywords: z.string().optional(),
        sessionId: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) return [];

      const topicModel = new TopicModel(await getServerDBInstance(), ctx.userId);

      return topicModel.query(input);
    }),

  hasTopics: topicProcedure.query(async ({ ctx }) => {
    return (await ctx.topicModel.count()) === 0;
  }),

  rankTopics: topicProcedure.input(z.number().optional()).query(async ({ ctx, input }) => {
    return ctx.topicModel.rank(input);
  }),

  removeAllTopics: topicProcedure.mutation(async ({ ctx }) => {
    return ctx.topicModel.deleteAll();
  }),

  removeTopic: topicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.topicModel.delete(input.id);
    }),

  searchTopics: topicProcedure
    .input(z.object({ keywords: z.string(), sessionId: z.string().nullable().optional() }))
    .query(async ({ input, ctx }) => {
      return ctx.topicModel.queryByKeyword(input.keywords, input.sessionId);
    }),

  // updateTopic: topicProcedure // Commented out
  //   .input(
  //     z.object({
  //       id: z.string(),
  //       value: UpdateTopicSchema,
  //     }),
  //   )
  //   .mutation(async ({ input, ctx }) => {
  //     return ctx.topicModel.update(input.id, input.value);
  //   }),
});

export type TopicRouter = typeof topicRouter;
