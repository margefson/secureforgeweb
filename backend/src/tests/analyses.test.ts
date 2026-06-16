import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../controllers/index.js";
import type { TrpcContext } from "../_core/context.js";

vi.mock("../models/applications.db.js", () => ({
  createApplication: vi.fn(),
  getApplicationsByUser: vi.fn(),
  getApplicationById: vi.fn(),
  updateApplication: vi.fn(),
  deleteApplication: vi.fn(),
  countApplicationsByUser: vi.fn(),
}));

vi.mock("../models/analyses.db.js", () => ({
  createAnalysis: vi.fn(),
  getAnalysisById: vi.fn(),
  getAnalysesByApplication: vi.fn(),
  getAnalysisWizardState: vi.fn(),
  saveAnalysisResponses: vi.fn(),
  completeAnalysis: vi.fn(),
}));

import * as applicationsDb from "../models/applications.db.js";
import * as analysesDb from "../models/analyses.db.js";

const mockUser = {
  id: 10,
  openId: "user-open-id",
  name: "Test User",
  email: "user@test.com",
  passwordHash: null,
  loginMethod: "local",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
  isActive: true,
  mustChangePassword: false,
};

const mockApp = {
  id: 1,
  userId: 10,
  name: "Portal Web",
  baseUrl: "https://app.test.com",
  description: "App de teste",
  techStack: "React + Node",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAnalysis = {
  id: 5,
  applicationId: 1,
  userId: 10,
  checklistId: 1,
  title: "Análise 15/06/2026",
  status: "em_andamento" as const,
  startedAt: new Date(),
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWizardState = {
  analysis: mockAnalysis,
  categories: [
    {
      id: 1,
      name: "Autenticação",
      description: null,
      color: "#22d3ee",
      sortOrder: 1,
      createdAt: new Date(),
      items: [
        {
          id: 101,
          checklistId: 1,
          categoryId: 1,
          code: "AUTH-01",
          title: "Política de senha",
          description: "Desc",
          owaspRef: "ASVS 2.1",
          suggestedSeverity: "high" as const,
          sortOrder: 1,
          createdAt: new Date(),
          categoryName: "Autenticação",
          categoryColor: "#22d3ee",
        },
      ],
      answeredInCategory: 0,
      totalInCategory: 1,
    },
  ],
  items: [
    {
      id: 101,
      checklistId: 1,
      categoryId: 1,
      code: "AUTH-01",
      title: "Política de senha",
      description: "Desc",
      owaspRef: "ASVS 2.1",
      suggestedSeverity: "high" as const,
      sortOrder: 1,
      createdAt: new Date(),
      categoryName: "Autenticação",
      categoryColor: "#22d3ee",
    },
  ],
  responses: {},
  progress: { totalItems: 1, answeredItems: 0, percentComplete: 0 },
};

function makeCtx(user: TrpcContext["user"]): TrpcContext {
  return { user, req: {} as never, res: {} as never };
}

describe("analyses router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create inicia análise para aplicação do usuário", async () => {
    vi.mocked(applicationsDb.getApplicationById).mockResolvedValue(mockApp);
    vi.mocked(analysesDb.createAnalysis).mockResolvedValue(mockAnalysis);
    const caller = appRouter.createCaller(makeCtx(mockUser));
    const result = await caller.analyses.create({ applicationId: 1 });
    expect(result.id).toBe(5);
    expect(analysesDb.createAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: 1, userId: 10 })
    );
  });

  it("create retorna NOT_FOUND para aplicação de outro usuário", async () => {
    vi.mocked(applicationsDb.getApplicationById).mockResolvedValue({ ...mockApp, userId: 99 });
    const caller = appRouter.createCaller(makeCtx(mockUser));
    await expect(caller.analyses.create({ applicationId: 1 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("getWizard retorna estado do wizard", async () => {
    vi.mocked(analysesDb.getAnalysisById).mockResolvedValue(mockAnalysis);
    vi.mocked(applicationsDb.getApplicationById).mockResolvedValue(mockApp);
    vi.mocked(analysesDb.getAnalysisWizardState).mockResolvedValue(mockWizardState);
    const caller = appRouter.createCaller(makeCtx(mockUser));
    const result = await caller.analyses.getWizard({ id: 5 });
    expect(result.progress.totalItems).toBe(1);
  });

  it("saveResponses persiste respostas e retorna achados sugeridos", async () => {
    vi.mocked(analysesDb.getAnalysisById).mockResolvedValue(mockAnalysis);
    vi.mocked(applicationsDb.getApplicationById).mockResolvedValue(mockApp);
    vi.mocked(analysesDb.saveAnalysisResponses).mockResolvedValue({
      savedCount: 1,
      suggestedFindings: [
        {
          itemId: 101,
          itemCode: "AUTH-01",
          itemTitle: "Política de senha",
          categoryName: "Autenticação",
          compliance: "nao_conforme",
          suggestedSeverity: "high",
          recommendation: null,
        },
      ],
      progress: { totalItems: 1, answeredItems: 1, percentComplete: 100 },
      status: "em_andamento",
    });
    const caller = appRouter.createCaller(makeCtx(mockUser));
    const result = await caller.analyses.saveResponses({
      analysisId: 5,
      responses: [{ itemId: 101, compliance: "nao_conforme", notes: "Sem política" }],
    });
    expect(result.savedCount).toBe(1);
    expect(result.suggestedFindings).toHaveLength(1);
    expect(result.suggestedFindings[0].itemCode).toBe("AUTH-01");
  });

  it("saveResponses rejeita conformidade inválida", async () => {
    vi.mocked(analysesDb.getAnalysisById).mockResolvedValue(mockAnalysis);
    vi.mocked(applicationsDb.getApplicationById).mockResolvedValue(mockApp);
    const caller = appRouter.createCaller(makeCtx(mockUser));
    await expect(
      caller.analyses.saveResponses({
        analysisId: 5,
        responses: [{ itemId: 101, compliance: "invalido" as never }],
      })
    ).rejects.toThrow();
  });

  it("complete exige todos os itens respondidos", async () => {
    vi.mocked(analysesDb.getAnalysisById).mockResolvedValue(mockAnalysis);
    vi.mocked(applicationsDb.getApplicationById).mockResolvedValue(mockApp);
    vi.mocked(analysesDb.getAnalysisWizardState).mockResolvedValue(mockWizardState);
    const caller = appRouter.createCaller(makeCtx(mockUser));
    await expect(caller.analyses.complete({ id: 5 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("complete marca análise como concluída", async () => {
    vi.mocked(analysesDb.getAnalysisById).mockResolvedValue(mockAnalysis);
    vi.mocked(applicationsDb.getApplicationById).mockResolvedValue(mockApp);
    vi.mocked(analysesDb.getAnalysisWizardState).mockResolvedValue({
      ...mockWizardState,
      progress: { totalItems: 1, answeredItems: 1, percentComplete: 100 },
    });
    vi.mocked(analysesDb.completeAnalysis).mockResolvedValue({
      ...mockAnalysis,
      status: "concluida",
      completedAt: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx(mockUser));
    const result = await caller.analyses.complete({ id: 5 });
    expect(result.success).toBe(true);
    expect(analysesDb.completeAnalysis).toHaveBeenCalledWith(5);
  });

  it("listByApplication retorna análises da aplicação", async () => {
    vi.mocked(applicationsDb.getApplicationById).mockResolvedValue(mockApp);
    vi.mocked(analysesDb.getAnalysesByApplication).mockResolvedValue([mockAnalysis]);
    const caller = appRouter.createCaller(makeCtx(mockUser));
    const result = await caller.analyses.listByApplication({ applicationId: 1 });
    expect(result).toHaveLength(1);
  });

  it("procedures exigem autenticação", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.analyses.getWizard({ id: 5 })).rejects.toThrow();
  });
});
