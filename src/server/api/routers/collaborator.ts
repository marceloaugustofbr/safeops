import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { collaboratorSchema } from "~/lib/validations/schemas";

export const collaboratorRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "ADMIN";
      const userLocationId = ctx.session.user.locationId;

      const where: Record<string, unknown> = {};

      if (!isAdmin && userLocationId) {
        where.locationId = userLocationId;
      }

      if (input?.search) {
        where.OR = [
          { name: { contains: input.search } },
          { registration: { contains: input.search } },
        ];
      }

      if (input?.status) {
        where.status = input.status;
      }

      return ctx.db.collaborator.findMany({
        where,
        include: { operation: true, location: true, createdBy: true },
        orderBy: { name: "asc" },
      });
    }),

  getByRegistration: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const collaborator = await ctx.db.collaborator.findUnique({
        where: { registration: input },
        include: { operation: true, location: true },
      });

      if (!collaborator) return null;

      const isAdmin = ctx.session.user.role === "ADMIN";
      const userLocationId = ctx.session.user.locationId;

      if (
        !isAdmin &&
        userLocationId &&
        collaborator.locationId !== userLocationId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Colaborador não pertence à sua localização",
        });
      }

      return collaborator;
    }),

  create: protectedProcedure
    .input(collaboratorSchema)
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "ADMIN";
      const userLocationId = ctx.session.user.locationId;

      const existing = await ctx.db.collaborator.findUnique({
        where: { registration: input.registration },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Matrícula já cadastrada",
        });
      }

      if (!isAdmin && !userLocationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário sem localização não pode cadastrar colaboradores",
        });
      }

      return ctx.db.collaborator.create({
        data: {
          registration: input.registration,
          name: input.name,
          manager: input.manager,
          admissionDate: new Date(input.admissionDate),
          operationId: input.operationId,
          locationId: isAdmin
            ? (input.locationId ?? userLocationId!)
            : userLocationId!,
          createdById: ctx.session.user.id,
          status: "ACTIVE",
        },
        include: { operation: true, location: true },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: collaboratorSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.collaborator.update({
        where: { id: input.id },
        data: input.data,
        include: { operation: true, location: true },
      });
    }),

  createMany: protectedProcedure
    .input(
      z.object({
        collaborators: z.array(
          z.object({
            registration: z.string().min(1),
            name: z.string().min(1),
            manager: z.string().min(1),
            operationName: z.string().min(1),
            admissionDate: z.string().min(1),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "ADMIN";
      const userLocationId = ctx.session.user.locationId;

      if (!isAdmin && !userLocationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário sem localização não pode cadastrar colaboradores",
        });
      }

      const locationId = isAdmin ? userLocationId! : userLocationId!;

      const operations = await ctx.db.operation.findMany({
        where: { locationId },
        select: { id: true, name: true },
      });
      const opMap = new Map(operations.map((o) => [o.name.toLowerCase(), o.id]));

      const created: string[] = [];
      const skipped: { registration: string; reason: string }[] = [];
      const errors: { registration: string; reason: string }[] = [];

      for (const c of input.collaborators) {
        try {
          const opId = opMap.get(c.operationName.toLowerCase());
          if (!opId) {
            errors.push({
              registration: c.registration,
              reason: `Operação "${c.operationName}" não encontrada`,
            });
            continue;
          }

          const existing = await ctx.db.collaborator.findUnique({
            where: { registration: c.registration },
          });

          if (existing) {
            skipped.push({
              registration: c.registration,
              reason: "Matrícula já cadastrada",
            });
            continue;
          }

          await ctx.db.collaborator.create({
            data: {
              registration: c.registration,
              name: c.name,
              manager: c.manager,
              admissionDate: new Date(c.admissionDate),
              operationId: opId,
              locationId,
              createdById: ctx.session.user.id,
              status: "ACTIVE",
            },
          });
          created.push(c.registration);
        } catch (e) {
          errors.push({
            registration: c.registration,
            reason: e instanceof Error ? e.message : "Erro desconhecido",
          });
        }
      }

      return { created, skipped, errors, total: input.collaborators.length };
    }),

  toggleStatus: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const collab = await ctx.db.collaborator.findUnique({
        where: { id: input },
      });

      if (!collab) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.collaborator.update({
        where: { id: input },
        data: {
          status: collab.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
        },
      });
    }),
});
