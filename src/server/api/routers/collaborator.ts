import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "~/server/api/trpc";
import { collaboratorSchema } from "~/lib/validations/schemas";

const collaboratorListSelect = {
  id: true,
  registration: true,
  name: true,
  role: true,
  manager: true,
  status: true,
  operation: { select: { name: true } },
} as const;

const collaboratorSearchSelect = {
  id: true,
  name: true,
  registration: true,
  role: true,
  manager: true,
  operation: { select: { name: true } },
} as const;

export const collaboratorRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.string().optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(100).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "ADMIN";
      const userLocationId = ctx.session.user.locationId;
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;

      const where: Prisma.CollaboratorWhereInput = {};

      if (!isAdmin && userLocationId) {
        where.locationId = userLocationId;
      }

      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { registration: { contains: input.search, mode: "insensitive" } },
        ];
      }

      if (input?.status) {
        where.status = input.status;
      }

      const [collaborators, total] = await ctx.db.$transaction([
        ctx.db.collaborator.findMany({
          where,
          select: collaboratorListSelect,
          orderBy: { name: "asc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.collaborator.count({ where }),
      ]);

      return {
        collaborators,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  search: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "ADMIN";
      const userLocationId = ctx.session.user.locationId;

      const where: Prisma.CollaboratorWhereInput = {};

      if (!isAdmin && userLocationId) {
        where.locationId = userLocationId;
      }

      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { registration: { contains: input.search, mode: "insensitive" } },
        ];
      }

      return ctx.db.collaborator.findMany({
        where,
        select: collaboratorSearchSelect,
        orderBy: { name: "asc" },
        take: 20,
      });
    }),

  getByRegistration: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const collaborator = await ctx.db.collaborator.findUnique({
        where: { registration: input },
        select: {
          id: true,
          registration: true,
          name: true,
          role: true,
          manager: true,
          admissionDate: true,
          status: true,
          locationId: true,
          operation: { select: { name: true } },
          location: { select: { name: true, city: true } },
        },
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
          role: input.role,
          manager: input.manager,
          admissionDate: new Date(input.admissionDate),
          operationId: input.operationId,
          locationId: isAdmin
            ? (input.locationId ?? userLocationId!)
            : userLocationId!,
          createdById: ctx.session.user.id,
          status: "ACTIVE",
        },
        select: {
          id: true,
          registration: true,
          name: true,
          role: true,
          manager: true,
          status: true,
          operation: { select: { name: true } },
        },
      });
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: collaboratorSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.collaborator.update({
        where: { id: input.id },
        data: input.data,
        select: {
          id: true,
          registration: true,
          name: true,
          role: true,
          manager: true,
          status: true,
          operation: { select: { name: true } },
        },
      });
    }),

  createMany: protectedProcedure
    .input(
      z.object({
        collaborators: z.array(
          z.object({
            registration: z.string().min(1),
            name: z.string().min(1),
            role: z.string().optional(),
            manager: z.string().min(1),
            operationName: z.string().min(1),
            admissionDate: z
              .string()
              .min(1)
              .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato deve ser YYYY-MM-DD")
              .refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
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

      const locationId = isAdmin
        ? (userLocationId ?? "")
        : userLocationId!;

      if (!locationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário sem localização não pode cadastrar colaboradores",
        });
      }

      const operations = await ctx.db.operation.findMany({
        where: { locationId },
        select: { id: true, name: true },
      });
      const opMap = new Map(operations.map((o) => [o.name.toLowerCase(), o.id]));

      const existingRegs = await ctx.db.collaborator.findMany({
        where: { registration: { in: input.collaborators.map((c) => c.registration) } },
        select: { registration: true },
      });
      const existingSet = new Set(existingRegs.map((e) => e.registration));

      const skipped: { registration: string; reason: string }[] = [];
      const errors: { registration: string; reason: string }[] = [];
      const toCreate: { registration: string; name: string; role?: string; manager: string; admissionDate: Date; operationId: string; locationId: string; createdById: string; status: string }[] = [];

      for (const c of input.collaborators) {
        const opId = opMap.get(c.operationName.toLowerCase());
        if (!opId) {
          errors.push({
            registration: c.registration,
            reason: `Operação "${c.operationName}" não encontrada`,
          });
          continue;
        }

        if (existingSet.has(c.registration)) {
          skipped.push({
            registration: c.registration,
            reason: "Matrícula já cadastrada",
          });
          continue;
        }

        toCreate.push({
          registration: c.registration,
          name: c.name,
          role: c.role,
          manager: c.manager,
          admissionDate: new Date(c.admissionDate),
          operationId: opId,
          locationId,
          createdById: ctx.session.user.id,
          status: "ACTIVE",
        });
      }

      const created: string[] = [];
      if (toCreate.length > 0) {
        await ctx.db.collaborator.createMany({ data: toCreate });
        created.push(...toCreate.map((c) => c.registration));
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
