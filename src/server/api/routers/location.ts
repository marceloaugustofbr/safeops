import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
    .input(locationSchema.extend({ operationNames: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { operationNames, ...locationData } = input;
      return ctx.db.$transaction(async (tx) => {
        const location = await tx.location.create({ data: locationData });
        if (operationNames && operationNames.length > 0) {
          await tx.operation.createMany({
            data: operationNames.map((name) => ({
              name,
              locationId: location.id,
            })),
          });
        }
        return location;
      });
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
    const [usersCount, collaboratorsCount, deliveriesCount, operationsCount] =
      await ctx.db.$transaction([
        ctx.db.user.count({ where: { locationId: input } }),
        ctx.db.collaborator.count({ where: { locationId: input } }),
        ctx.db.delivery.count({ where: { locationId: input } }),
        ctx.db.operation.count({ where: { locationId: input } }),
      ]);

    const deps: string[] = [];
    if (usersCount > 0) deps.push(`${usersCount} usuário(s)`);
    if (collaboratorsCount > 0) deps.push(`${collaboratorsCount} colaborador(es)`);
    if (deliveriesCount > 0) deps.push(`${deliveriesCount} entrega(s)`);
    if (operationsCount > 0) deps.push(`${operationsCount} operação(ões)`);

    if (deps.length > 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Não é possível excluir: ${deps.join(", ")} vinculado(s) a esta localização`,
      });
    }

    return ctx.db.location.delete({ where: { id: input } });
  }),
});
