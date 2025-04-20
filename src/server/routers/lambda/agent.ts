import { z } from 'zod';

import { INBOX_SESSION_ID } from '@/const/session';
import { DEFAULT_AGENT_CONFIG } from '@/const/settings';
import { AgentModel } from '@/database/models/agent';
import { FileModel } from '@/database/models/file';
import { KnowledgeBaseModel } from '@/database/models/knowledgeBase';
import { SessionModel } from '@/database/models/session';
import { UserModel } from '@/database/models/user';
import { getServerDBInstance } from '@/database/server/connection';
import { pino } from '@/libs/logger';
import { authedProcedure, router } from '@/libs/trpc';
import { AgentService } from '@/server/services/agent';
import { KnowledgeItem, KnowledgeType } from '@/types/knowledgeBase';
import { keyVaults } from '@/libs/trpc/middleware/keyVaults';
import { checkAuth } from '@/libs/trpc/middleware/auth';
import { LobeChatDatabase } from '@/database/type';

// Middleware to add db to context
const dbMiddleware = authedProcedure.use(async (opts) => {
  const db = await getServerDBInstance();
  return opts.next({
    ctx: {
      ...opts.ctx, // Preserve existing context
      db: db as LobeChatDatabase, // Add db to context
    },
  });
});

// Apply middleware with db and keyVaults, then add models
const agentProcedure = dbMiddleware.use(keyVaults).use(checkAuth).use(async (opts) => {
  // opts.ctx now includes db
  return opts.next({
    ctx: {
      ...opts.ctx,
      agentModel: new AgentModel(opts.ctx.db, opts.ctx.userId),
      sessionModel: new SessionModel(opts.ctx.db, opts.ctx.userId),
      userModel: new UserModel(opts.ctx.db, opts.ctx.userId),
    },
  });
});

export const agentRouter = router({
  createAgentFiles: agentProcedure
    .input(
      z.object({
        agentId: z.string(),
        enabled: z.boolean().optional(),
        fileIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.agentModel.createAgentFiles(input.agentId, input.fileIds, input.enabled);
    }),

  createAgentKnowledgeBase: agentProcedure
    .input(
      z.object({
        agentId: z.string(),
        enabled: z.boolean().optional(),
        knowledgeBaseId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.agentModel.createAgentKnowledgeBase(
        input.agentId,
        input.knowledgeBaseId,
        input.enabled,
      );
    }),

  deleteAgentFile: agentProcedure
    .input(
      z.object({
        agentId: z.string(),
        fileId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.agentModel.deleteAgentFile(input.agentId, input.fileId);
    }),

  deleteAgentKnowledgeBase: agentProcedure
    .input(
      z.object({
        agentId: z.string(),
        knowledgeBaseId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.agentModel.deleteAgentKnowledgeBase(input.agentId, input.knowledgeBaseId);
    }),

  getAgentConfig: agentProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (input.sessionId === INBOX_SESSION_ID) {
        const item = await ctx.sessionModel.findByIdOrSlug(INBOX_SESSION_ID);
        // if there is no session for user, create one
        if (!item) {
          // if there is no user, return default config
          const db = await getServerDBInstance();
          const user = await UserModel.findById(db, ctx.userId);
          if (!user) return DEFAULT_AGENT_CONFIG;

          const res = await ctx.agentService.createInbox();
          pino.info('create inbox session', res);
        }
      }

      const session = await ctx.sessionModel.findByIdOrSlug(input.sessionId);

      if (!session) throw new Error('Session not found');
      const sessionId = session.id;

      return ctx.agentModel.findBySessionId(sessionId);
    }),

  getKnowledgeBasesAndFiles: agentProcedure
    .input(
      z.object({
        agentId: z.string(),
      }),
    )
    .query(async ({ ctx, input }): Promise<KnowledgeItem[]> => {
      const knowledgeBases = await ctx.knowledgeBaseModel.query();

      const files = await ctx.fileModel.query({
        showFilesInKnowledgeBase: false,
      });

      const knowledge = await ctx.agentModel.getAgentAssignedKnowledge(input.agentId);

      return [
        ...files
          // 过滤掉所有图片
          .filter((file) => !file.fileType.startsWith('image'))
          .map((file) => ({
            enabled: knowledge.files.some((item) => item.id === file.id),
            fileType: file.fileType,
            id: file.id,
            name: file.name,
            type: KnowledgeType.File,
          })),
        ...knowledgeBases.map((knowledgeBase) => ({
          avatar: knowledgeBase.avatar,
          description: knowledgeBase.description,
          enabled: knowledge.knowledgeBases.some((item) => item.id === knowledgeBase.id),
          id: knowledgeBase.id,
          name: knowledgeBase.name,
          type: KnowledgeType.KnowledgeBase,
        })),
      ];
    }),

  toggleFile: agentProcedure
    .input(
      z.object({
        agentId: z.string(),
        enabled: z.boolean().optional(),
        fileId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.agentModel.toggleFile(input.agentId, input.fileId, input.enabled);
    }),

  toggleKnowledgeBase: agentProcedure
    .input(
      z.object({
        agentId: z.string(),
        enabled: z.boolean().optional(),
        knowledgeBaseId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.agentModel.toggleKnowledgeBase(
        input.agentId,
        input.knowledgeBaseId,
        input.enabled,
      );
    }),

  getDefaultAgentConfig: agentProcedure.query(async ({ ctx }) => {
    // ... existing logic ...
    // Use ctx.db here if needed, e.g. for UserModel.findById
    const user = await UserModel.findById(ctx.db, ctx.userId);
    // ... rest of logic ...
  }),
});
