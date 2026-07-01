import { z } from "zod";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { reasonSchema } from "~/lib/validations/schemas";

export const reasonRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.reason.findMany({
      orderBy: { name: "asc" },
    });
  }),

  create: adminProcedure
    .input(reasonSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.reason.create({ data: input });
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: reasonSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.reason.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.db.reason.delete({ where: { id: input } });
  }),
});
