import { useLocation, useRoute } from "wouter";

import { trpc } from "@/lib/trpc";

import DashboardLayout from "@/components/DashboardLayout";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { ArrowLeft, ExternalLink, ClipboardList, Globe, Play, History } from "lucide-react";

import { toast } from "sonner";



const SEVERITY_COLORS: Record<string, string> = {

  critical: "border-red-400/30 text-red-400",

  high: "border-orange-400/30 text-orange-400",

  medium: "border-yellow-400/30 text-yellow-400",

  low: "border-emerald-400/30 text-emerald-400",

};



const STATUS_LABELS: Record<string, string> = {

  rascunho: "Rascunho",

  em_andamento: "Em andamento",

  concluida: "Concluída",

};



const STATUS_COLORS: Record<string, string> = {

  rascunho: "text-muted-foreground",

  em_andamento: "text-primary",

  concluida: "text-emerald-400",

};



export default function ApplicationDetail() {

  const [, navigate] = useLocation();

  const [, params] = useRoute("/applications/:id");

  const id = Number(params?.id);



  const { data: app, isLoading } = trpc.applications.getById.useQuery(

    { id },

    { enabled: Number.isFinite(id) && id > 0 }

  );

  const { data: catalog } = trpc.checklist.catalog.useQuery();

  const { data: analyses, refetch: refetchAnalyses } = trpc.analyses.listByApplication.useQuery(

    { applicationId: id },

    { enabled: Number.isFinite(id) && id > 0 }

  );



  const createAnalysis = trpc.analyses.create.useMutation({

    onSuccess: (analysis) => {

      refetchAnalyses();

      toast.success("Análise iniciada!");

      navigate(`/analyses/${analysis.id}/checklist`);

    },

    onError: (e) => toast.error(e.message),

  });



  if (isLoading) {

    return (

      <DashboardLayout>

        <p className="text-sm text-muted-foreground font-mono">Carregando...</p>

      </DashboardLayout>

    );

  }



  if (!app) {

    return (

      <DashboardLayout>

        <p className="text-sm text-muted-foreground font-mono">Aplicação não encontrada.</p>

      </DashboardLayout>

    );

  }



  const items = catalog?.items ?? [];

  const itemsByCategory: Record<string, typeof items> = {};

  for (const item of items) {

    if (!itemsByCategory[item.categoryName]) itemsByCategory[item.categoryName] = [];

    itemsByCategory[item.categoryName].push(item);

  }



  const inProgress = analyses?.find((a) => a.status === "em_andamento" || a.status === "rascunho");



  return (

    <DashboardLayout>

      <div className="space-y-6 max-w-4xl">

        <div className="flex items-center gap-3">

          <button onClick={() => navigate("/applications")} className="text-muted-foreground hover:text-foreground">

            <ArrowLeft className="w-4 h-4" />

          </button>

          <div className="flex-1 min-w-0">

            <h1 className="text-xl font-bold text-foreground font-mono truncate">{app.name}</h1>

            {app.techStack && <p className="text-sm text-primary font-mono">{app.techStack}</p>}

          </div>

        </div>



        <div className="bg-card border border-border rounded-xl p-5 space-y-3">

          <div className="flex items-center gap-2 text-sm font-mono text-foreground">

            <Globe className="w-4 h-4 text-primary" />

            Detalhes da aplicação

          </div>

          {app.baseUrl && (

            <p className="text-sm font-mono">

              <span className="text-muted-foreground">URL: </span>

              <a href={app.baseUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">

                {app.baseUrl} <ExternalLink className="w-3 h-3" />

              </a>

            </p>

          )}

          {app.description && (

            <p className="text-sm text-muted-foreground">{app.description}</p>

          )}

          <p className="text-xs text-muted-foreground font-mono">

            Cadastrada em {new Date(app.createdAt).toLocaleDateString("pt-BR")}

          </p>

        </div>



        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center justify-between gap-4">

          <div>

            <p className="text-sm font-mono font-semibold text-foreground">Nova análise de segurança</p>

            <p className="text-xs text-muted-foreground mt-1">

              Percorra o checklist OWASP por categoria e registre a conformidade de cada controle.

            </p>

          </div>

          {inProgress ? (

            <Button

              variant="outline"

              className="font-mono text-xs shrink-0"

              onClick={() => navigate(`/analyses/${inProgress.id}/checklist`)}

            >

              <Play className="w-3.5 h-3.5 mr-1" /> Continuar análise

            </Button>

          ) : (

            <Button

              className="font-mono text-xs shrink-0"

              onClick={() => createAnalysis.mutate({ applicationId: id })}

              disabled={createAnalysis.isPending}

            >

              <Play className="w-3.5 h-3.5 mr-1" />

              {createAnalysis.isPending ? "Iniciando..." : "Iniciar análise"}

            </Button>

          )}

        </div>



        {analyses && analyses.length > 0 && (

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">

            <div className="flex items-center gap-2">

              <History className="w-4 h-4 text-primary" />

              <h2 className="text-sm font-mono font-semibold text-foreground">Histórico de análises</h2>

            </div>

            <div className="space-y-2">

              {analyses.map((analysis) => (

                <div

                  key={analysis.id}

                  className="flex items-center justify-between gap-3 py-2 border-t border-border/50 first:border-0 first:pt-0"

                >

                  <div className="min-w-0">

                    <p className="text-sm font-mono text-foreground truncate">{analysis.title}</p>

                    <p className="text-xs text-muted-foreground">

                      {new Date(analysis.startedAt).toLocaleDateString("pt-BR")}

                      {analysis.completedAt && ` — concluída em ${new Date(analysis.completedAt).toLocaleDateString("pt-BR")}`}

                    </p>

                  </div>

                  <div className="flex items-center gap-2 shrink-0">

                    <span className={`text-xs font-mono ${STATUS_COLORS[analysis.status] ?? ""}`}>

                      {STATUS_LABELS[analysis.status] ?? analysis.status}

                    </span>

                    <Button

                      variant="ghost"

                      size="sm"

                      className="font-mono text-xs h-7"

                      onClick={() => navigate(`/analyses/${analysis.id}/checklist`)}

                    >

                      Abrir

                    </Button>

                  </div>

                </div>

              ))}

            </div>

          </div>

        )}



        {catalog?.checklist && (

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">

            <div className="flex items-center justify-between gap-3">

              <div className="flex items-center gap-2">

                <ClipboardList className="w-4 h-4 text-primary" />

                <h2 className="text-sm font-mono font-semibold text-foreground">

                  Checklist {catalog.checklist.name} v{catalog.checklist.version}

                </h2>

              </div>

              <Badge variant="outline" className="font-mono text-xs">

                {catalog.totalItems} itens

              </Badge>

            </div>



            {Object.entries(itemsByCategory).map(([category, items]) => (

              <div key={category} className="border-t border-border/50 pt-3">

                <p className="text-xs font-mono text-primary mb-2">{category}</p>

                <div className="space-y-2">

                  {items?.map((item) => (

                    <div key={item.id} className="flex items-start justify-between gap-3 text-xs">

                      <div>

                        <span className="font-mono text-foreground">{item.code}</span>

                        <span className="text-muted-foreground"> — {item.title}</span>

                      </div>

                      <Badge variant="outline" className={`font-mono shrink-0 ${SEVERITY_COLORS[item.suggestedSeverity] ?? ""}`}>

                        {item.suggestedSeverity}

                      </Badge>

                    </div>

                  ))}

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </DashboardLayout>

  );

}


