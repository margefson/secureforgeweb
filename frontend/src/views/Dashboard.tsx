import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Shield, Globe, ClipboardCheck, BarChart2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PHASES = [
  { phase: "Fase 0", label: "Setup & Rebrand", status: "Concluída", color: "text-emerald-400" },
  { phase: "Fase 1", label: "Cadastro de Aplicações", status: "Concluída", color: "text-emerald-400" },
  { phase: "Fase 2", label: "Checklist OWASP", status: "Concluída", color: "text-emerald-400" },
  { phase: "Fase 3", label: "Achados & Hardening", status: "Próxima", color: "text-primary" },
  { phase: "Fase 4", label: "Dashboard & Relatório", status: "Planejada", color: "text-muted-foreground" },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: stats } = trpc.applications.stats.useQuery();
  const { data: catalog } = trpc.checklist.catalog.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground font-mono">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bem-vindo ao SecureForge Web — plataforma de diagnóstico e hardening de aplicações web
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">{stats?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">Aplicações cadastradas</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
              <ClipboardCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">{catalog?.totalItems ?? 0}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">Itens no checklist OWASP</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-3">
              <BarChart2 className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">—</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">Score de postura (Fase 4)</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold font-mono text-foreground">Roadmap de Implementação</h2>
          </div>
          <div className="space-y-3">
            {PHASES.map(({ phase, label, status, color }) => (
              <div key={phase} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-mono text-foreground">{phase} — {label}</p>
                </div>
                <span className={`text-xs font-mono ${color}`}>{status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-mono font-semibold text-foreground">Cadastrar aplicação</p>
            <p className="text-xs text-muted-foreground mt-1">
              Registre uma aplicação web e visualize o checklist de segurança disponível.
            </p>
          </div>
          <Button variant="outline" className="font-mono text-xs shrink-0" onClick={() => navigate("/applications/new")}>
            Nova aplicação <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
