import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { operationSchema } from "~/lib/validations/schemas";

export const operationRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const isAdmin = ctx.session.user.role === "ADMIN";
    const locationId = ctx.session.user.locationId;

      return ctx.db.operation.findMany({
        where: isAdmin ? undefined : { locationId: locationId ?? undefined },
        select: { id: true, name: true, locationId: true, location: { select: { name: true, city: true } } },
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
    const collaboratorsCount = await ctx.db.collaborator.count({
      where: { operationId: input },
    });

    if (collaboratorsCount > 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Não é possível excluir: ${collaboratorsCount} colaborador(es) vinculado(s) a esta operação`,
      });
    }

    return ctx.db.operation.delete({ where: { id: input } });
  }),
});
