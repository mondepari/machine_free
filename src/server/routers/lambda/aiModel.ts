import { z } from 'zod';

import { AiModelModel } from '@/database/models/aiModel';
import { UserModel } from '@/database/models/user';
import { getServerDBInstance } from '@/database/server/connection';
import { pino } from '@/libs/logger';
import { authedProcedure, router } from '@/libs/trpc';
import { AiInfraRepos } from '@/server/repositories/aiInfra';
import { KeyVaultsGateKeeper } from '@/server/repositories/keyVaults';
import { getServerGlobalConfig } from '@/server/utils/config';
import { CreateAiModelSchema, ToggleAiModelEnableSchema, UpdateAiModelSchema } from '@/types/aiModel';
import { ProviderConfig } from '@/types/user/settings';
// import { isAiModelEnabled } from '@/utils/checkEnv'; // Removed for now

const modelProcedure = authedProcedure.use(async (opts) => {
  // Removed check: if (!isAiModelEnabled()) {
  // Removed check:   throw new TRPCError({ code: 'FORBIDDEN' });
  // Removed check: }

  const db = await getServerDBInstance();

  const gateKeeper = await KeyVaultsGateKeeper.initWithEnvKey();
  const { aiProvider } = await getServerGlobalConfig();

  return opts.next({
    ctx: {
      aiInfraRepos: new AiInfraRepos(
        db,
        opts.ctx.userId,
        aiProvider as Record<string, ProviderConfig>,
      ),
      aiModelModel: new AiModelModel(db, opts.ctx.userId),
      db, // Keep db here for now, but it's the wrong type!
      gateKeeper,
      userModel: new UserModel(db, opts.ctx.userId),
    },
  });
});

export const aiModelRouter = router({
  batchToggleAiModels: modelProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        id: z.string(),
        models: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.batchToggleAiModels(input.id, input.models, input.enabled);
    }),
  batchUpdateAiModels: modelProcedure
    .input(
      z.object({
        id: z.string(),
        // TODO: 补齐校验 Schema
        models: z.array(z.any()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.batchUpdateAiModels(input.id, input.models);
    }),

  clearModelsByProvider: modelProcedure
    .input(z.object({ providerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.clearModelsByProvider(input.providerId);
    }),
  clearRemoteModels: modelProcedure
    .input(z.object({ providerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.clearRemoteModels(input.providerId);
    }),

  createAiModel: modelProcedure
    .input(CreateAiModelSchema)
    .mutation(async ({ input, ctx }) => {
      const data = await ctx.aiModelModel.create(input);
      return data?.id;
    }),

  deleteAiModel: modelProcedure
    .input(z.object({ id: z.string(), providerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.delete(input.id, input.providerId);
    }),

  getAiModelById: modelProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.aiModelModel.findById(input.id);
    }),

  getAiProviderModelList: modelProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<AiProviderModelListItem[]> => {
      return ctx.aiInfraRepos.getAiProviderModelList(input.id);
    }),

  toggleModelEnabled: modelProcedure
    .input(ToggleAiModelEnableSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.toggleModelEnabled(input);
    }),

  updateAiModel: modelProcedure
    .input(
      z.object({
        id: z.string(),
        providerId: z.string(),
        value: UpdateAiModelSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.update(input.id, input.providerId, input.value);
    }),

  updateAiModelOrder: modelProcedure
    .input(
      z.object({
        providerId: z.string(),
        sortMap: z.array(
          z.object({
            id: z.string(),
            sort: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiModelModel.updateModelsOrder(input.providerId, input.sortMap);
    }),
});

export type AiModelRouter = typeof aiModelRouter;
