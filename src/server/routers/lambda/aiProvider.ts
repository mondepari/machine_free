import { z } from 'zod';

import { AiProviderModel } from '@/database/models/aiProvider';
import { UserModel } from '@/database/models/user';
import { AiInfraRepos } from '@/database/repositories/aiInfra';
import { getServerDBInstance } from '@/database/server/connection';
import { authedProcedure, router } from '@/libs/trpc';
import { getServerGlobalConfig } from '@/server/globalConfig';
import { KeyVaultsGateKeeper } from '@/server/modules/KeyVaultsEncrypt';
import {
  AiProviderDetailItem,
  AiProviderRuntimeState,
  CreateAiProviderSchema,
  UpdateAiProviderConfigSchema,
  UpdateAiProviderSchema,
} from '@/types/aiProvider';
import { ProviderConfig } from '@/types/user/settings';

const aiProviderProcedure = authedProcedure.use(async (opts) => {
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
      aiProviderModel: new AiProviderModel(db, opts.ctx.userId),
      db,
      gateKeeper,
      userModel: new UserModel(db, opts.ctx.userId),
    },
  });
});

export const aiProviderRouter = router({
  createAiProvider: aiProviderProcedure
    .input(CreateAiProviderSchema)
    .mutation(async ({ input, ctx }) => {
      const data = await ctx.aiProviderModel.create(input, ctx.gateKeeper.encrypt);

      return data?.id;
    }),

  getAiProviderById: aiProviderProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }): Promise<AiProviderDetailItem | undefined> => {
      return ctx.aiInfraRepos.getAiProviderDetail(input.id, KeyVaultsGateKeeper.getUserKeyVaults);
    }),

  getAiProviderList: aiProviderProcedure.query(async ({ ctx }) => {
    return await ctx.aiInfraRepos.getAiProviderList();
  }),

  getAiProviderRuntimeState: aiProviderProcedure
    .input(z.object({ isLogin: z.boolean().optional() }))
    .query(async ({ ctx }): Promise<AiProviderRuntimeState> => {
      return ctx.aiInfraRepos.getAiProviderRuntimeState(KeyVaultsGateKeeper.getUserKeyVaults);
    }),

  removeAiProvider: aiProviderProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.delete(input.id);
    }),

  toggleProviderEnabled: aiProviderProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.toggleProviderEnabled(input.id, input.enabled);
    }),

  updateAiProvider: aiProviderProcedure
    .input(
      z.object({
        id: z.string(),
        value: UpdateAiProviderSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.update(input.id, input.value);
    }),

  updateAiProviderConfig: aiProviderProcedure
    .input(
      z.object({
        id: z.string(),
        value: UpdateAiProviderConfigSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.updateConfig(input.id, input.value, ctx.gateKeeper.encrypt);
    }),

  updateAiProviderOrder: aiProviderProcedure
    .input(
      z.object({
        sortMap: z.array(
          z.object({
            id: z.string(),
            sort: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.updateOrder(input.sortMap);
    }),
});

export type AiProviderRouter = typeof aiProviderRouter;
