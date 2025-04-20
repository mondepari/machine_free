import { z } from 'zod';

import { SessionGroupModel } from '@/database/models/sessionGroup';
import { DB_SessionGroupSchema } from '@/database/_deprecated/schemas/sessionGroup';
import { getServerDBInstance } from '@/database/server/connection';
import { authedProcedure, router } from '@/libs/trpc';
import { SessionGroupItem } from '@/types/session';


const sessionGroupProcedure = authedProcedure.use(async (opts) => {
  const db = await getServerDBInstance();
  return opts.next({
    ctx: {
      sessionGroupModel: new SessionGroupModel(db, opts.ctx.userId),
    },
  });
});

export const sessionGroupRouter = router({
  addSessionGroup: sessionGroupProcedure
    .input(DB_SessionGroupSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.sessionGroupModel.create({ name: input.name, sort: input.sort });
    }),

  createSessionGroup: sessionGroupProcedure
    .input(
      z.object({
        name: z.string(),
        sort: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const data = await ctx.sessionGroupModel.create({
        name: input.name,
        sort: input.sort,
      });

      return data?.id;
    }),

  getSessionGroup: sessionGroupProcedure.query(async ({ ctx }): Promise<SessionGroupItem[]> => {
    return ctx.sessionGroupModel.query() as any;
  }),

  removeAllSessionGroups: sessionGroupProcedure.mutation(async ({ ctx }) => {
    return ctx.sessionGroupModel.deleteAll();
  }),

  removeSessionGroup: sessionGroupProcedure
    .input(z.object({ id: z.string(), removeChildren: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.sessionGroupModel.delete(input.id);
    }),

  updateSessionGroup: sessionGroupProcedure
    .input(
      z.object({
        id: z.string(),
        value: DB_SessionGroupSchema.partial(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.sessionGroupModel.update(input.id, input.value as Partial<SessionGroupItem>);
    }),

  updateSessionGroupOrder: sessionGroupProcedure
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
      console.log('sortMap:', input.sortMap);

      return ctx.sessionGroupModel.updateOrder(input.sortMap);
    }),
});

export type SessionGroupRouter = typeof sessionGroupRouter;
