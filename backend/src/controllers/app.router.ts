import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies.js";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc.js";
import {
  createLocalUser,
  getUserByEmail,
  upsertUser,
  getAllUsers,
  updateUserRole,
  updateUserInfo,
  deleteUserById,
  resetUserPassword,
  clearMustChangePassword,
  createPasswordResetToken,
  getPasswordResetToken,
  resetPasswordWithToken,
  getNotificationsByUser,
  markNotificationRead,
  markAllNotificationsRead,
  countUnreadNotifications,
} from "../models/db.js";
import { sendPasswordResetEmail } from "../services/email.js";
import crypto from "crypto";
import { registerSchema, loginSchema, createApplicationSchema, updateApplicationSchema, createAnalysisSchema, saveResponsesSchema, validateJoi } from "../lib/validation.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sdk } from "../_core/sdk.js";
import {
  createApplication,
  getApplicationsByUser,
  getApplicationById,
  updateApplication,
  deleteApplication,
  countApplicationsByUser,
} from "../models/applications.db.js";
import { getChecklistCatalog } from "../models/checklist.db.js";
import {
  createAnalysis,
  getAnalysisById,
  getAnalysesByApplication,
  getAnalysisWizardState,
  saveAnalysisResponses,
  completeAnalysis,
} from "../models/analyses.db.js";

async function assertApplicationAccess(applicationId: number, userId: number, isAdmin: boolean) {
  const app = await getApplicationById(applicationId);
  if (!app || (!isAdmin && app.userId !== userId)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Aplicação não encontrada" });
  }
  return app;
}

async function assertAnalysisAccess(analysisId: number, userId: number, isAdmin: boolean) {
  const analysis = await getAnalysisById(analysisId);
  if (!analysis) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Análise não encontrada" });
  }
  await assertApplicationAccess(analysis.applicationId, userId, isAdmin);
  return analysis;
}

const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  register: publicProcedure
    .input(z.object({ name: z.string(), email: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const validated = validateJoi<{ name: string; email: string; password: string }>(
        registerSchema,
        input
      );
      const existing = await getUserByEmail(validated.email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
      const passwordHash = await bcrypt.hash(validated.password, 12);
      const openId = `local_${uuidv4()}`;
      const user = await createLocalUser({
        name: validated.name,
        email: validated.email,
        passwordHash,
        openId,
      });
      return { success: true, userId: user?.id };
    }),

  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const validated = validateJoi<{ email: string; password: string }>(loginSchema, input);
      const user = await getUserByEmail(validated.email);
      const DUMMY_HASH = "$2b$12$invalidhashfortimingneutralizationXXXXXXXXXXXXXXXXXXX";
      const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
      const valid = await bcrypt.compare(validated.password, hashToCompare);
      if (!user || !user.passwordHash || !valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      }
      await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
      return { success: true, mustChangePassword: user.mustChangePassword ?? false };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email(), origin: z.string() }))
    .mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      if (!user || !user.email) return { success: true, linkInBand: false };
      const token = crypto.randomBytes(48).toString("hex");
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await createPasswordResetToken(user.id, token, expiresAt);
      const resetUrl = `${input.origin}/reset-password?token=${token}`;
      const emailResult = await sendPasswordResetEmail({
        to: user.email,
        userName: user.name ?? "Usuário",
        resetUrl,
        expiresMinutes: 10,
      });
      if (emailResult.linkInBand) {
        return {
          success: true,
          linkInBand: true,
          resetUrl,
          deliveryNote: emailResult.deliveryNote,
        };
      }
      return { success: true, linkInBand: false };
    }),

  validateResetToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const record = await getPasswordResetToken(input.token);
      if (!record) return { valid: false, reason: "Token inválido" };
      if (record.usedAt) return { valid: false, reason: "Token já utilizado" };
      if (new Date() > record.expiresAt) return { valid: false, reason: "Token expirado" };
      return { valid: true };
    }),

  confirmPasswordReset: publicProcedure
    .input(z.object({ token: z.string(), newPassword: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const record = await getPasswordResetToken(input.token);
      if (!record) throw new TRPCError({ code: "BAD_REQUEST", message: "Token inválido" });
      if (record.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Token já utilizado" });
      if (new Date() > record.expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token expirado. Solicite uma nova redefinição.",
        });
      }
      const hash = await bcrypt.hash(input.newPassword, 12);
      await resetPasswordWithToken(record.userId, hash, record.id);
      return { success: true };
    }),

  clearMustChangePassword: protectedProcedure.mutation(async ({ ctx }) => {
    await clearMustChangePassword(ctx.user.id);
    return { success: true };
  }),

  changePassword: protectedProcedure
    .input(z.object({ currentPassword: z.string(), newPassword: z.string().min(8) }))
    .mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(ctx.user.email ?? "");
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui senha local" });
      }
      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta" });
      const hash = await bcrypt.hash(input.newPassword, 12);
      await resetUserPassword(ctx.user.id, hash);
      await clearMustChangePassword(ctx.user.id);
      return { success: true };
    }),
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

const adminRouter = router({
  listUsers: adminProcedure.query(async () => getAllUsers()),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "security-analyst", "admin"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode alterar seu próprio perfil" });
      }
      await updateUserRole(input.userId, input.role);
      return { success: true };
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().min(1).max(100).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use a página de perfil para editar seus próprios dados",
        });
      }
      await updateUserInfo(input.userId, { name: input.name, email: input.email });
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode excluir sua própria conta" });
      }
      await deleteUserById(input.userId);
      return { success: true };
    }),

  resetUserPassword: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use a página de perfil para alterar sua própria senha",
        });
      }
      const hash = await bcrypt.hash("Security2026@", 12);
      await resetUserPassword(input.userId, hash);
      return { success: true };
    }),
});

const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => getNotificationsByUser(ctx.user.id)),
  unreadCount: protectedProcedure.query(async ({ ctx }) => countUnreadNotifications(ctx.user.id)),
  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id, ctx.user.id);
      return { success: true };
    }),
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),
});

const applicationsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        baseUrl: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        techStack: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const validated = validateJoi<{
        name: string;
        baseUrl?: string | null;
        description?: string | null;
        techStack?: string | null;
      }>(createApplicationSchema, input);
      return createApplication({
        userId: ctx.user.id,
        name: validated.name,
        baseUrl: validated.baseUrl || null,
        description: validated.description || null,
        techStack: validated.techStack || null,
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => getApplicationsByUser(ctx.user.id)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      return assertApplicationAccess(input.id, ctx.user.id, ctx.user.role === "admin");
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        baseUrl: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        techStack: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertApplicationAccess(input.id, ctx.user.id, ctx.user.role === "admin");
      const { id, ...rest } = input;
      const validated = validateJoi<{
        name?: string;
        baseUrl?: string | null;
        description?: string | null;
        techStack?: string | null;
      }>(updateApplicationSchema, rest);
      const updated = await updateApplication(id, ctx.user.id, {
        name: validated.name,
        baseUrl: validated.baseUrl ?? undefined,
        description: validated.description ?? undefined,
        techStack: validated.techStack ?? undefined,
      });
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aplicação não encontrada" });
      }
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await assertApplicationAccess(input.id, ctx.user.id, ctx.user.role === "admin");
      const ok = await deleteApplication(input.id, ctx.user.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Aplicação não encontrada" });
      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const total = await countApplicationsByUser(ctx.user.id);
    return { total };
  }),
});

const checklistRouter = router({
  catalog: protectedProcedure.query(async () => getChecklistCatalog()),
});

const analysesRouter = router({
  create: protectedProcedure
    .input(z.object({ applicationId: z.number(), title: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const validated = validateJoi<{ applicationId: number; title?: string }>(
        createAnalysisSchema,
        input
      );
      await assertApplicationAccess(
        validated.applicationId,
        ctx.user.id,
        ctx.user.role === "admin"
      );
      return createAnalysis({
        applicationId: validated.applicationId,
        userId: ctx.user.id,
        title: validated.title,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      return assertAnalysisAccess(input.id, ctx.user.id, ctx.user.role === "admin");
    }),

  listByApplication: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input, ctx }) => {
      await assertApplicationAccess(
        input.applicationId,
        ctx.user.id,
        ctx.user.role === "admin"
      );
      return getAnalysesByApplication(input.applicationId);
    }),

  getWizard: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      await assertAnalysisAccess(input.id, ctx.user.id, ctx.user.role === "admin");
      const state = await getAnalysisWizardState(input.id);
      if (!state) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Análise não encontrada" });
      }
      return state;
    }),

  saveResponses: protectedProcedure
    .input(
      z.object({
        analysisId: z.number(),
        responses: z.array(
          z.object({
            itemId: z.number(),
            compliance: z.enum(["conforme", "parcial", "nao_conforme", "nao_aplicavel"]),
            notes: z.string().optional().nullable(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertAnalysisAccess(input.analysisId, ctx.user.id, ctx.user.role === "admin");
      try {
        const validated = validateJoi<{
          responses: Array<{
            itemId: number;
            compliance: "conforme" | "parcial" | "nao_conforme" | "nao_aplicavel";
            notes?: string | null;
          }>;
        }>(saveResponsesSchema, { responses: input.responses });

        const result = await saveAnalysisResponses(input.analysisId, validated.responses);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Análise não encontrada" });
        }
        return result;
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("Item de checklist inválido")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
        }
        throw err;
      }
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const analysis = await assertAnalysisAccess(input.id, ctx.user.id, ctx.user.role === "admin");
      const state = await getAnalysisWizardState(input.id);
      if (!state) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Análise não encontrada" });
      }
      if (state.progress.answeredItems < state.progress.totalItems) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Responda todos os itens antes de concluir (${state.progress.answeredItems}/${state.progress.totalItems})`,
        });
      }
      if (analysis.status === "concluida") {
        return { success: true, alreadyCompleted: true };
      }
      await completeAnalysis(input.id);
      return { success: true, alreadyCompleted: false };
    }),
});

export { authRouter, adminRouter, notificationsRouter, applicationsRouter, checklistRouter, analysesRouter };
