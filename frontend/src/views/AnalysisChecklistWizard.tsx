import { useEffect, useMemo, useState } from "react";

import { useLocation, useRoute } from "wouter";

import { trpc } from "@/lib/trpc";

import DashboardLayout from "@/components/DashboardLayout";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Progress } from "@/components/ui/progress";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { toast } from "sonner";

import {

  ArrowLeft,

  ArrowRight,

  CheckCircle2,

  ClipboardList,

  AlertTriangle,

  Loader2,

} from "lucide-react";



type Compliance = "conforme" | "parcial" | "nao_conforme" | "nao_aplicavel";



const COMPLIANCE_OPTIONS: { value: Compliance; label: string; color: string }[] = [

  { value: "conforme", label: "Conforme", color: "text-emerald-400" },

  { value: "parcial", label: "Parcialmente conforme", color: "text-yellow-400" },

  { value: "nao_conforme", label: "Não conforme", color: "text-red-400" },

  { value: "nao_aplicavel", label: "Não aplicável", color: "text-muted-foreground" },

];



const SEVERITY_COLORS: Record<string, string> = {

  critical: "border-red-400/30 text-red-400",

  high: "border-orange-400/30 text-orange-400",

  medium: "border-yellow-400/30 text-yellow-400",

  low: "border-emerald-400/30 text-emerald-400",

};



type LocalResponse = { compliance: Compliance; notes: string };



export default function AnalysisChecklistWizard() {

  const [, navigate] = useLocation();

  const [, params] = useRoute("/analyses/:id/checklist");

  const analysisId = Number(params?.id);



  const utils = trpc.useUtils();

  const { data: wizard, isLoading } = trpc.analyses.getWizard.useQuery(

    { id: analysisId },

    { enabled: Number.isFinite(analysisId) && analysisId > 0 }

  );



  const [categoryIndex, setCategoryIndex] = useState(0);

  const [localResponses, setLocalResponses] = useState<Record<number, LocalResponse>>({});

  const [showSummary, setShowSummary] = useState(false);

  const [lastSuggestedCount, setLastSuggestedCount] = useState(0);



  const categories = wizard?.categories ?? [];

  const currentCategory = categories[categoryIndex];



  useEffect(() => {

    if (!wizard) return;

    const initial: Record<number, LocalResponse> = {};

    for (const item of wizard.items) {

      const saved = wizard.responses[item.id];

      if (saved) {

        initial[item.id] = {

          compliance: saved.compliance as Compliance,

          notes: saved.notes ?? "",

        };

      }

    }

    setLocalResponses(initial);

    if (wizard.analysis.status === "concluida") setShowSummary(true);

  }, [wizard]);



  const saveMutation = trpc.analyses.saveResponses.useMutation({

    onSuccess: (result) => {

      setLastSuggestedCount(result.suggestedFindings.length);

      utils.analyses.getWizard.invalidate({ id: analysisId });

      toast.success(`${result.savedCount} resposta(s) salva(s)`);

    },

    onError: (e) => toast.error(e.message),

  });



  const completeMutation = trpc.analyses.complete.useMutation({

    onSuccess: () => {

      utils.analyses.getWizard.invalidate({ id: analysisId });

      toast.success("Análise concluída com sucesso!");

      if (wizard?.analysis.applicationId) {

        navigate(`/applications/${wizard.analysis.applicationId}`);

      }

    },

    onError: (e) => toast.error(e.message),

  });



  const categoryProgress = useMemo(() => {

    if (!currentCategory) return { answered: 0, total: 0, complete: false };

    const items = currentCategory.items;

    const answered = items.filter((i) => localResponses[i.id]?.compliance).length;

    return { answered, total: items.length, complete: answered === items.length && items.length > 0 };

  }, [currentCategory, localResponses]);



  function setItemResponse(itemId: number, patch: Partial<LocalResponse>) {

    setLocalResponses((prev) => ({

      ...prev,

      [itemId]: { compliance: prev[itemId]?.compliance ?? "conforme", notes: prev[itemId]?.notes ?? "", ...patch },

    }));

  }



  async function saveCurrentCategory(andAdvance = true) {

    if (!currentCategory) return;

    const responses = currentCategory.items

      .filter((i) => localResponses[i.id]?.compliance)

      .map((i) => ({

        itemId: i.id,

        compliance: localResponses[i.id].compliance,

        notes: localResponses[i.id].notes || null,

      }));



    if (responses.length < currentCategory.items.length) {

      toast.error("Responda todos os itens desta categoria antes de continuar.");

      return;

    }



    await saveMutation.mutateAsync({ analysisId, responses });



    if (andAdvance) {

      if (categoryIndex < categories.length - 1) {

        setCategoryIndex((i) => i + 1);

      } else {

        setShowSummary(true);

      }

    }

  }



  if (isLoading) {

    return (

      <DashboardLayout>

        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">

          <Loader2 className="w-4 h-4 animate-spin" /> Carregando checklist...

        </div>

      </DashboardLayout>

    );

  }



  if (!wizard) {

    return (

      <DashboardLayout>

        <p className="text-sm text-muted-foreground font-mono">Análise não encontrada.</p>

      </DashboardLayout>

    );

  }



  const { analysis, progress } = wizard;

  const isCompleted = analysis.status === "concluida";



  if (showSummary) {

    const nonCompliant = Object.entries(localResponses).filter(

      ([, r]) => r.compliance === "parcial" || r.compliance === "nao_conforme"

    );



    return (

      <DashboardLayout>

        <div className="space-y-6 max-w-3xl">

          <div className="flex items-center gap-3">

            <button

              onClick={() => navigate(`/applications/${analysis.applicationId}`)}

              className="text-muted-foreground hover:text-foreground"

            >

              <ArrowLeft className="w-4 h-4" />

            </button>

            <div>

              <h1 className="text-xl font-bold text-foreground font-mono">Resumo da análise</h1>

              <p className="text-sm text-muted-foreground">{analysis.title}</p>

            </div>

          </div>



          <div className="bg-card border border-border rounded-xl p-5 space-y-4">

            <div className="flex items-center gap-2">

              <CheckCircle2 className="w-5 h-5 text-emerald-400" />

              <p className="text-sm font-mono font-semibold text-foreground">

                Checklist completo — {progress.percentComplete}%

              </p>

            </div>

            <Progress value={progress.percentComplete} />

            <p className="text-xs text-muted-foreground font-mono">

              {progress.answeredItems} de {progress.totalItems} itens respondidos

            </p>

          </div>



          {nonCompliant.length > 0 && (

            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5 space-y-3">

              <div className="flex items-center gap-2">

                <AlertTriangle className="w-4 h-4 text-orange-400" />

                <h2 className="text-sm font-mono font-semibold text-foreground">

                  Achados sugeridos ({lastSuggestedCount || nonCompliant.length})

                </h2>

              </div>

              <p className="text-xs text-muted-foreground">

                Itens não conformes ou parciais gerarão achados na Fase 3. Revise abaixo:

              </p>

              <div className="space-y-2">

                {wizard.items

                  .filter((i) => {

                    const r = localResponses[i.id];

                    return r && (r.compliance === "parcial" || r.compliance === "nao_conforme");

                  })

                  .map((item) => (

                    <div key={item.id} className="flex items-start justify-between gap-3 text-xs border-t border-border/50 pt-2">

                      <div>

                        <span className="font-mono text-foreground">{item.code}</span>

                        <span className="text-muted-foreground"> — {item.title}</span>

                        {localResponses[item.id]?.notes && (

                          <p className="text-muted-foreground mt-1 italic">{localResponses[item.id].notes}</p>

                        )}

                      </div>

                      <Badge variant="outline" className={`font-mono shrink-0 ${SEVERITY_COLORS[item.suggestedSeverity] ?? ""}`}>

                        {item.suggestedSeverity}

                      </Badge>

                    </div>

                  ))}

              </div>

            </div>

          )}



          <div className="flex gap-3">

            {!isCompleted && (

              <Button

                className="font-mono"

                onClick={() => completeMutation.mutate({ id: analysisId })}

                disabled={completeMutation.isPending || progress.answeredItems < progress.totalItems}

              >

                {completeMutation.isPending ? "Concluindo..." : "Concluir análise"}

              </Button>

            )}

            <Button

              variant="outline"

              className="font-mono"

              onClick={() => navigate(`/applications/${analysis.applicationId}`)}

            >

              Voltar à aplicação

            </Button>

          </div>

        </div>

      </DashboardLayout>

    );

  }



  return (

    <DashboardLayout>

      <div className="space-y-6 max-w-3xl">

        <div className="flex items-center gap-3">

          <button

            onClick={() => navigate(`/applications/${analysis.applicationId}`)}

            className="text-muted-foreground hover:text-foreground"

          >

            <ArrowLeft className="w-4 h-4" />

          </button>

          <div className="flex-1 min-w-0">

            <h1 className="text-xl font-bold text-foreground font-mono truncate">{analysis.title}</h1>

            <p className="text-xs text-muted-foreground font-mono">Wizard de checklist OWASP</p>

          </div>

          <Badge variant="outline" className="font-mono text-xs shrink-0">

            {progress.percentComplete}%

          </Badge>

        </div>



        <div className="space-y-2">

          <div className="flex justify-between text-xs font-mono text-muted-foreground">

            <span>Progresso geral</span>

            <span>{progress.answeredItems}/{progress.totalItems} itens</span>

          </div>

          <Progress value={progress.percentComplete} />

        </div>



        <div className="flex flex-wrap gap-2">

          {categories.map((cat, idx) => (

            <button

              key={cat.id}

              onClick={() => setCategoryIndex(idx)}

              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${

                idx === categoryIndex

                  ? "bg-primary/10 border-primary/30 text-primary"

                  : cat.answeredInCategory === cat.totalInCategory && cat.totalInCategory > 0

                    ? "border-emerald-400/30 text-emerald-400"

                    : "border-border text-muted-foreground hover:text-foreground"

              }`}

            >

              {cat.name}

              <span className="ml-1 opacity-70">({cat.answeredInCategory}/{cat.totalInCategory})</span>

            </button>

          ))}

        </div>



        {currentCategory && (

          <div className="bg-card border border-border rounded-xl p-5 space-y-5">

            <div className="flex items-center gap-2 border-b border-border/50 pb-3">

              <ClipboardList className="w-4 h-4 text-primary" />

              <h2 className="text-sm font-mono font-semibold text-foreground">{currentCategory.name}</h2>

              <span className="text-xs text-muted-foreground font-mono ml-auto">

                Categoria {categoryIndex + 1} de {categories.length}

              </span>

            </div>



            {currentCategory.items.map((item) => (

              <div key={item.id} className="space-y-3 border-t border-border/30 pt-4 first:border-0 first:pt-0">

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <p className="text-sm font-mono text-foreground">

                      <span className="text-primary">{item.code}</span> — {item.title}

                    </p>

                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>

                    {item.owaspRef && (

                      <p className="text-xs text-muted-foreground/70 mt-1 font-mono">Ref: {item.owaspRef}</p>

                    )}

                  </div>

                  <Badge variant="outline" className={`font-mono text-xs shrink-0 ${SEVERITY_COLORS[item.suggestedSeverity] ?? ""}`}>

                    {item.suggestedSeverity}

                  </Badge>

                </div>



                <RadioGroup

                  value={localResponses[item.id]?.compliance ?? ""}

                  onValueChange={(v) => setItemResponse(item.id, { compliance: v as Compliance })}

                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"

                >

                  {COMPLIANCE_OPTIONS.map((opt) => (

                    <div key={opt.value} className="flex items-center gap-2">

                      <RadioGroupItem value={opt.value} id={`${item.id}-${opt.value}`} />

                      <Label htmlFor={`${item.id}-${opt.value}`} className={`text-xs font-mono cursor-pointer ${opt.color}`}>

                        {opt.label}

                      </Label>

                    </div>

                  ))}

                </RadioGroup>



                <Textarea

                  placeholder="Observações (opcional)"

                  value={localResponses[item.id]?.notes ?? ""}

                  onChange={(e) => setItemResponse(item.id, { notes: e.target.value })}

                  className="text-xs font-mono min-h-16"

                />

              </div>

            ))}

          </div>

        )}



        <div className="flex items-center justify-between gap-3">

          <Button

            variant="outline"

            className="font-mono text-xs"

            disabled={categoryIndex === 0}

            onClick={() => setCategoryIndex((i) => i - 1)}

          >

            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Anterior

          </Button>



          <Button

            className="font-mono text-xs"

            onClick={() => saveCurrentCategory(true)}

            disabled={saveMutation.isPending || !categoryProgress.complete}

          >

            {saveMutation.isPending ? (

              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Salvando...</>

            ) : categoryIndex < categories.length - 1 ? (

              <>Salvar e continuar <ArrowRight className="w-3.5 h-3.5 ml-1" /></>

            ) : (

              <>Salvar e ver resumo <ArrowRight className="w-3.5 h-3.5 ml-1" /></>

            )}

          </Button>

        </div>

      </div>

    </DashboardLayout>

  );

}


