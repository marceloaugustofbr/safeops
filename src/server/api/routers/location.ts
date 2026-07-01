import { z } from "zod";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { locationSchema } from "~/lib/validations/schemas";

export const locationRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.location.findMany({
      orderBy: [{ name: "asc" }, { city: "asc" }],
    });
  }),

  create: adminProcedure
    .input(locationSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.location.create({ data: input });
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: locationSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.location.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.db.location.delete({ where: { id: input } });
  }),
});
