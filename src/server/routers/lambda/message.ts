import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { serverDB } from '@/database/server';

import { CHAT_FUNCTION_SCHEMA } from '@/const/schema';
import { MessageModel } from '@/database/models/message';
import { updateMessagePluginSchema } from '@/database/schemas';
import { getServerDBInstance } from '@/database/server/connection';
import { authedProcedure, publicProcedure, router } from '@/libs/trpc';
import { getFullFileUrl } from '@/server/utils/files';
import { ChatMessage } from '@/types/message';
import { BatchTaskResult } from '@/types/service';
// import { ChatMessageSchema } from '@/types/chatMessage'; // Commented out due to import error

type ChatMessageList = ChatMessage[];

const messageProcedure = authedProcedure.use(async (opts) => {
  const db = await getServerDBInstance();
  return opts.next({
    ctx: { messageModel: new MessageModel(db, opts.ctx.userId) },
  });
});

export const messageRouter = router({
  batchCreateMessages: messageProcedure
    .input(z.array(z.any()))
    .mutation(async ({ input, ctx }): Promise<BatchTaskResult> => {
      const data = await ctx.messageModel.batchCreate(input);

      return { added: data.rowCount as number, ids: [], skips: [], success: true };
    }),

  count: messageProcedure
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
      return ctx.messageModel.count(input);
    }),

  countWords: messageProcedure
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
      return ctx.messageModel.countWords(input);
    }),

  // createMessage: messageProcedure // Commented out due to ChatMessageSchema import error
  //   .input(ChatMessageSchema)
  //   .mutation(async ({ ctx, input }) => {
  //     return ctx.messageModel.create(input);
  //   }),

  // TODO: it will be removed in V2
  getAllMessages: messageProcedure.query(async ({ ctx }): Promise<ChatMessageList> => {
    return ctx.messageModel.queryAll() as any;
  }),

  // TODO: it will be removed in V2
  getAllMessagesInSession: messageProcedure
    .input(
      z.object({
        sessionId: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }): Promise<ChatMessageList> => {
      return ctx.messageModel.queryBySessionId(input.sessionId) as any;
    }),

  getHeatmaps: messageProcedure.query(async ({ ctx }) => {
    return ctx.messageModel.getHeatmaps();
  }),

  // TODO: 未来这部分方法也需要使用 authedProcedure
  getMessages: publicProcedure
    .input(
      z.object({
        current: z.number().optional(),
        pageSize: z.number().optional(),
        sessionId: z.string().nullable().optional(),
        topicId: z.string().nullable().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) return [];

      const messageModel = new MessageModel(serverDB, ctx.userId);

      return messageModel.query(input, { postProcessUrl: (path) => getFullFileUrl(path) });
    }),

  rankModels: messageProcedure.query(async ({ ctx }) => {
    return ctx.messageModel.rankModels();
  }),

  removeAllMessages: messageProcedure.mutation(async ({ ctx }) => {
    return ctx.messageModel.deleteAllMessages();
  }),

  removeMessage: messageProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.messageModel.deleteMessage(input.id);
    }),

  removeMessageQuery: messageProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.messageModel.deleteMessageQuery(input.id);
    }),

  removeMessages: messageProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input }) => {
      return ctx.messageModel.deleteMessages(input);
    }),

  removeMessagesByAssistant: messageProcedure
    .input(
      z.object({
        sessionId: z.string().nullable().optional(),
        topicId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.messageModel.deleteMessagesBySession(input.sessionId, input.topicId);
    }),

  searchMessages: messageProcedure
    .input(z.object({ keywords: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.messageModel.queryByKeyword(input.keywords);
    }),

  update: messageProcedure
    .input(
      z.object({
        id: z.string(),
        value: z.object({}).passthrough().partial(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.messageModel.update(input.id, input.value);
    }),

  updateMessagePlugin: messageProcedure
    .input(
      z.object({
        id: z.string(),
        value: updateMessagePluginSchema.partial(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.messageModel.updateMessagePlugin(input.id, input.value);
    }),

  updatePluginError: messageProcedure
    .input(
      z.object({
        id: z.string(),
        value: z.object({}).passthrough().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.messageModel.updateMessagePlugin(input.id, { error: input.value });
    }),

  updatePluginState: messageProcedure
    .input(
      z.object({
        id: z.string(),
        value: z.object({}).passthrough(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.messageModel.updatePluginState(input.id, input.value);
    }),

  updateTTS: messageProcedure
    .input(
      z.object({
        id: z.string(),
        value: z
          .object({
            contentMd5: z.string().optional(),
            file: z.string().optional(),
            voice: z.string().optional(),
          })
          .or(z.literal(false)),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.value === false) {
        return ctx.messageModel.deleteMessageTTS(input.id);
      }

      return ctx.messageModel.updateTTS(input.id, input.value);
    }),

  updateTranslate: messageProcedure
    .input(
      z.object({
        id: z.string(),
        value: z
          .object({
            content: z.string().optional(),
            from: z.string().optional(),
            to: z.string(),
          })
          .or(z.literal(false)),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.value === false) {
        return ctx.messageModel.deleteMessageTranslate(input.id);
      }

      return ctx.messageModel.updateTranslate(input.id, input.value);
    }),
});

export type MessageRouter = typeof messageRouter;
