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

  createMany: adminProcedure
    .input(z.object({ names: z.array(z.string().min(1)), locationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.operation.createMany({
        data: input.names.map((name) => ({
          name,
          locationId: input.locationId,
        })),
        skipDuplicates: true,
      });
      return { count: input.names.length };
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
