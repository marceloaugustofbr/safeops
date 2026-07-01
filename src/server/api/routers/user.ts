import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
} from "~/server/api/trpc";
import { userSchema, userUpdateSchema } from "~/lib/validations/schemas";
import { auth } from "~/server/better-auth";

export const userRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      include: { location: true },
      orderBy: { name: "asc" },
    });
  }),

  getById: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.user.findUnique({
      where: { id: input },
      include: { location: true },
    });
  }),

  create: adminProcedure.input(userSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Email já cadastrado",
      });
    }

    const { password, ...userData } = input;

    await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password,
        name: userData.name,
      },
    });

    await ctx.db.user.update({
      where: { email: userData.email },
      data: { role: userData.role, locationId: userData.locationId ?? null },
    });

    return { success: true };
  }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: userUpdateSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.db.user.delete({ where: { id: input } });
  }),
});
