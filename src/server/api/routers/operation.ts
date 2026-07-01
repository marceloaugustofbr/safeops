import { z } from "zod";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { operationSchema } from "~/lib/validations/schemas";

export const operationRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.operation.findMany({
      include: { location: true },
      orderBy: [{ name: "asc" }],
    });
  }),

  create: adminProcedure
    .input(operationSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.operation.create({ data: input });
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: operationSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.operation.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.db.operation.delete({ where: { id: input } });
  }),
});
