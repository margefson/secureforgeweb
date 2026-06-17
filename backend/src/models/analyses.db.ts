import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { getDb } from "./db.js";
import {
  analyses,
  checklistResponses,
  defaultRecommendations,
  InsertAnalysis,
  Analysis,
  ChecklistResponse,
} from "../../drizzle/schema.js";
import { getActiveChecklist, listChecklistCategories, listChecklistItems } from "./checklist.db.js";
import { deleteFindingsByAnalysisIds } from "./findings.db.js";
import { getApplicationById } from "./applications.db.js";
import type { ChecklistItemWithCategory } from "./checklist.db.js";

export type ComplianceValue = "conforme" | "parcial" | "nao_conforme" | "nao_aplicavel";

export type ResponseInput = {
  itemId: number;
  compliance: ComplianceValue;
  notes?: string | null;
};

export type SuggestedFinding = {
  itemId: number;
  itemCode: string;
  itemTitle: string;
  categoryName: string;
  compliance: "parcial" | "nao_conforme";
  suggestedSeverity: string;
  recommendation: {
    title: string;
    description: string;
    action: string;
    reference: string | null;
  } | null;
};

export type AnalysisProgress = {
  totalItems: number;
  answeredItems: number;
  percentComplete: number;
};

export async function createAnalysis(data: {
  applicationId: number;
  userId: number;
  title?: string;
}): Promise<Analysis> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const checklist = await getActiveChecklist();
  if (!checklist) throw new Error("Nenhum checklist ativo encontrado");

  const title =
    data.title?.trim() ||
    `Análise ${new Date().toLocaleDateString("pt-BR")} — ${checklist.name} v${checklist.version}`;

  const [row] = await db
    .insert(analyses)
    .values({
      applicationId: data.applicationId,
      userId: data.userId,
      checklistId: checklist.id,
      title,
      status: "em_andamento",
    } satisfies InsertAnalysis)
    .returning();

  return row;
}

export async function getAnalysisById(id: number): Promise<Analysis | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
  return row;
}

export async function getAnalysesByApplication(applicationId: number): Promise<Analysis[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(analyses)
    .where(eq(analyses.applicationId, applicationId))
    .orderBy(desc(analyses.createdAt));
}

export async function getResponsesByAnalysis(analysisId: number): Promise<ChecklistResponse[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(checklistResponses)
    .where(eq(checklistResponses.analysisId, analysisId))
    .orderBy(asc(checklistResponses.itemId));
}

export async function getDefaultRecommendationsByItemIds(itemIds: number[]) {
  const db = await getDb();
  if (!db || itemIds.length === 0) return [];
  return db
    .select()
    .from(defaultRecommendations)
    .where(inArray(defaultRecommendations.itemId, itemIds));
}

export function buildSuggestedFindings(
  responses: ResponseInput[],
  items: ChecklistItemWithCategory[],
  recommendations: Awaited<ReturnType<typeof getDefaultRecommendationsByItemIds>>
): SuggestedFinding[] {
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const recMap = new Map(recommendations.map((r) => [r.itemId, r]));
  const suggested: SuggestedFinding[] = [];

  for (const response of responses) {
    if (response.compliance !== "parcial" && response.compliance !== "nao_conforme") continue;
    const item = itemMap.get(response.itemId);
    if (!item) continue;
    const rec = recMap.get(response.itemId);
    suggested.push({
      itemId: item.id,
      itemCode: item.code,
      itemTitle: item.title,
      categoryName: item.categoryName,
      compliance: response.compliance,
      suggestedSeverity: item.suggestedSeverity,
      recommendation: rec
        ? {
            title: rec.title,
            description: rec.description,
            action: rec.action,
            reference: rec.reference,
          }
        : null,
    });
  }

  return suggested;
}

export function computeProgress(
  totalItems: number,
  answeredItemIds: Set<number>
): AnalysisProgress {
  const answeredItems = answeredItemIds.size;
  const percentComplete =
    totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;
  return { totalItems, answeredItems, percentComplete };
}

export async function upsertChecklistResponses(
  analysisId: number,
  responses: ResponseInput[]
): Promise<ChecklistResponse[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const saved: ChecklistResponse[] = [];
  for (const response of responses) {
    const existing = await db
      .select()
      .from(checklistResponses)
      .where(
        and(
          eq(checklistResponses.analysisId, analysisId),
          eq(checklistResponses.itemId, response.itemId)
        )
      )
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(checklistResponses)
        .set({
          compliance: response.compliance,
          notes: response.notes?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(checklistResponses.id, existing[0].id))
        .returning();
      saved.push(updated);
    } else {
      const [inserted] = await db
        .insert(checklistResponses)
        .values({
          analysisId,
          itemId: response.itemId,
          compliance: response.compliance,
          notes: response.notes?.trim() || null,
        })
        .returning();
      saved.push(inserted);
    }
  }

  await db
    .update(analyses)
    .set({ status: "em_andamento", updatedAt: new Date() })
    .where(eq(analyses.id, analysisId));

  return saved;
}

export async function completeAnalysis(analysisId: number, userId?: number): Promise<Analysis | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db
    .update(analyses)
    .set({
      status: "concluida",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(analyses.id, analysisId))
    .returning();

  if (row && userId) {
    const { generateFindingsFromAnalysis } = await import("./findings.db.js");
    await generateFindingsFromAnalysis(analysisId, userId);
  }

  return row;
}

export async function getAnalysisWizardState(analysisId: number) {
  const analysis = await getAnalysisById(analysisId);
  if (!analysis) return null;

  const [categories, items, responses, application] = await Promise.all([
    listChecklistCategories(),
    listChecklistItems(analysis.checklistId),
    getResponsesByAnalysis(analysisId),
    getApplicationById(analysis.applicationId),
  ]);

  const responseMap = Object.fromEntries(
    responses.map((r) => [r.itemId, { compliance: r.compliance, notes: r.notes }])
  );

  const answeredIds = new Set(responses.map((r) => r.itemId));
  const progress = computeProgress(items.length, answeredIds);

  const categoriesWithItems = categories.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.categoryId === cat.id),
    answeredInCategory: items.filter(
      (i) => i.categoryId === cat.id && answeredIds.has(i.id)
    ).length,
    totalInCategory: items.filter((i) => i.categoryId === cat.id).length,
  }));

  return {
    analysis,
    application: application
      ? {
          id: application.id,
          name: application.name,
          baseUrl: application.baseUrl,
          repositoryUrl: application.repositoryUrl,
          techStack: application.techStack,
        }
      : null,
    categories: categoriesWithItems,
    items,
    responses: responseMap,
    progress,
  };
}

export async function saveAnalysisResponses(
  analysisId: number,
  responses: ResponseInput[]
) {
  const analysis = await getAnalysisById(analysisId);
  if (!analysis) return null;

  const [items, allResponses] = await Promise.all([
    listChecklistItems(analysis.checklistId),
    upsertChecklistResponses(analysisId, responses),
  ]);

  const itemIds = new Set(items.map((i) => i.id));
  for (const r of responses) {
    if (!itemIds.has(r.itemId)) {
      throw new Error(`Item de checklist inválido: ${r.itemId}`);
    }
  }

  const recommendations = await getDefaultRecommendationsByItemIds(
    responses.map((r) => r.itemId)
  );
  const suggestedFindings = buildSuggestedFindings(responses, items, recommendations);

  const fullResponses = await getResponsesByAnalysis(analysisId);
  const progress = computeProgress(items.length, new Set(fullResponses.map((r) => r.itemId)));

  return {
    savedCount: allResponses.length,
    suggestedFindings,
    progress,
    status: analysis.status,
  };
}

export async function deleteAnalysesByApplication(applicationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const analysisRows = await db
    .select({ id: analyses.id })
    .from(analyses)
    .where(eq(analyses.applicationId, applicationId));

  const ids = analysisRows.map((r) => r.id);
  if (ids.length === 0) return;

  await deleteFindingsByAnalysisIds(ids);
  await db.delete(checklistResponses).where(inArray(checklistResponses.analysisId, ids));
  await db.delete(analyses).where(eq(analyses.applicationId, applicationId));
}
