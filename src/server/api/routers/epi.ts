import { z } from "zod";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { epiSchema } from "~/lib/validations/schemas";

export const epiRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.epi.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }),

  getById: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.epi.findUnique({ where: { id: input } });
  }),

  create: adminProcedure.input(epiSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.epi.create({ data: input });
  }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: epiSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.epi.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  softDelete: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.epi.update({
        where: { id: input },
        data: { deletedAt: new Date() },
      });
    }),
});
