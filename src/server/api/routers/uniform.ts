import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { uniformSchema } from "~/lib/validations/schemas";

export const uniformRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.uniform.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }),

  getById: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.uniform.findUnique({ where: { id: input } });
  }),

  create: adminProcedure
    .input(uniformSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.uniform.create({ data: input });
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: uniformSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.uniform.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  softDelete: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.uniform.update({
        where: { id: input },
        data: { deletedAt: new Date() },
      });
    }),
});
