import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { uploadToCloudinary } from "~/lib/cloudinary";

const deliveryItemSchema = z.object({
  itemType: z.enum(["EPI", "UNIFORM"]),
  itemName: z.string().min(1),
  size: z.string().optional(),
  quantity: z.number().int().min(1),
  reasonId: z.string().min(1),
  notes: z.string().optional(),
});

const createDeliverySchema = z.object({
  collaboratorId: z.string().min(1),
  date: z.string().min(1),
  items: z.array(deliveryItemSchema).min(1, "Adicione pelo menos um item"),
  signature: z.string().optional(),
});

export const deliveryRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          collaboratorId: z.string().optional(),
          search: z.string().optional(),
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

      if (input?.collaboratorId) {
        where.collaboratorId = input.collaboratorId;
      }

      if (input?.search) {
        where.collaborator = {
          OR: [
            { name: { contains: input.search } },
            { registration: { contains: input.search } },
          ],
        };
      }

      return ctx.db.delivery.findMany({
        where,
        include: {
          collaborator: true,
          user: true,
          items: { include: { reason: true } },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.db.delivery.findUnique({
        where: { id: input },
        include: {
          collaborator: true,
          user: true,
          items: { include: { reason: true } },
          attachments: true,
        },
      });
    }),

  create: protectedProcedure
    .input(createDeliverySchema)
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "ADMIN";
      const userLocationId = ctx.session.user.locationId;

      const collaborator = await ctx.db.collaborator.findUnique({
        where: { id: input.collaboratorId },
      });

      if (!collaborator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Colaborador não encontrado",
        });
      }

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

      const delivery = await ctx.db.delivery.create({
        data: {
          date: new Date(input.date),
          collaboratorId: input.collaboratorId,
          locationId: collaborator.locationId,
          userId: ctx.session.user.id,
          signature: input.signature,
          items: {
            create: input.items.map((item) => ({
              itemType: item.itemType,
              itemName: item.itemName,
              size: item.size,
              quantity: item.quantity,
              reasonId: item.reasonId,
              notes: item.notes,
            })),
          },
        },
        include: {
          collaborator: true,
          items: { include: { reason: true } },
          attachments: true,
        },
      });

      if (input.signature) {
        const dateStr = new Date().toISOString().split("T")[0];
        const folder = `safeops/collaborators/${collaborator.registration}`;

        const signatureUpload = await uploadToCloudinary(
          input.signature,
          folder,
          `assinatura-${dateStr}`,
        );

        if (signatureUpload) {
          await ctx.db.attachment.create({
            data: {
              deliveryId: delivery.id,
              cloudinaryUrl: signatureUpload.url,
              publicId: signatureUpload.publicId,
              fileName: `assinatura-${dateStr}.png`,
              type: "SIGNATURE",
            },
          });
        }
      }

      return delivery;
    }),

  uploadPdf: protectedProcedure
    .input(
      z.object({
        deliveryId: z.string(),
        pdfBase64: z.string(),
        fileName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const delivery = await ctx.db.delivery.findUnique({
        where: { id: input.deliveryId },
        include: { collaborator: true },
      });

      if (!delivery) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const folder = `safeops/collaborators/${delivery.collaborator.registration}`;

      const pdfUpload = await uploadToCloudinary(
        input.pdfBase64,
        folder,
        input.fileName.replace(/\.[^.]+$/, ""),
      );

      if (pdfUpload) {
        await ctx.db.attachment.create({
          data: {
            deliveryId: input.deliveryId,
            cloudinaryUrl: pdfUpload.url,
            publicId: pdfUpload.publicId,
            fileName: input.fileName,
            type: "PDF",
          },
        });
      }

      return { uploaded: !!pdfUpload, url: pdfUpload?.url };
    }),
});
