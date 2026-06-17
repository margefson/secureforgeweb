/**
 * Camada Controller — agrega routers tRPC por domínio (SecureForge Web).
 */
import { router } from "../_core/trpc.js";
import { systemRouter } from "../_core/systemRouter.js";
import {
  authRouter,
  adminRouter,
  notificationsRouter,
  applicationsRouter,
  checklistRouter,
  analysesRouter,
  findingsRouter,
  reportsRouter,
} from "./app.router.js";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  admin: adminRouter,
  notifications: notificationsRouter,
  applications: applicationsRouter,
  checklist: checklistRouter,
  analyses: analysesRouter,
  findings: findingsRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
