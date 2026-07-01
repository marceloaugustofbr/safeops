import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { collaboratorRouter } from "~/server/api/routers/collaborator";
import { deliveryRouter } from "~/server/api/routers/delivery";
import { epiRouter } from "~/server/api/routers/epi";
import { uniformRouter } from "~/server/api/routers/uniform";
import { reasonRouter } from "~/server/api/routers/reason";
import { operationRouter } from "~/server/api/routers/operation";
import { locationRouter } from "~/server/api/routers/location";
import { userRouter } from "~/server/api/routers/user";

export const appRouter = createTRPCRouter({
  collaborator: collaboratorRouter,
  delivery: deliveryRouter,
  epi: epiRouter,
  uniform: uniformRouter,
  reason: reasonRouter,
  operation: operationRouter,
  location: locationRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
