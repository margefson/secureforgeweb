import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import BrandLogo from "@/components/BrandLogo";
import {
  ClipboardCheck, Lock, ArrowRight, CheckCircle,
  Globe, BarChart2, FileText, Users,
} from "lucide-react";

const CATEGORIES = [
  { label: "Autenticação", color: "#22d3ee", desc: "Política de senhas, sessão, MFA" },
  { label: "Autorização", color: "#a855f7", desc: "RBAC, menor privilégio, rotas protegidas" },
  { label: "Validação", color: "#f97316", desc: "Anti-XSS, anti-SQLi, server-side" },
  { label: "Headers", color: "#eab308", desc: "CSP, HSTS, X-Frame-Options" },
  { label: "Segredos", color: "#06b6d4", desc: "Variáveis de ambiente, rotação" },
];

const FEATURES = [
  {
    icon: Globe,
    title: "Cadastro de Aplicações",
    desc: "Registre aplicações web com URL, stack tecnológica e responsável para organizar análises de segurança.",
    color: "#22c55e",
  },
  {
    icon: ClipboardCheck,
    title: "Checklist OWASP",
    desc: "Análise guiada por controles de segurança alinhados ao OWASP Top 10 e boas práticas de hardening.",
    color: "#06b6d4",
  },
  {
    icon: BarChart2,
    title: "Achados & Priorização",
    desc: "Registre fragilidades, classifique severidade e receba recomendações de correção priorizadas.",
    color: "#a855f7",
  },
  {
    icon: FileText,
    title: "Relatório de Postura",
    desc: "Visualize o score de segurança e exporte relatório consolidado com plano de ação de hardening.",
    color: "#f97316",
  },
  {
    icon: Users,
    title: "Equipes Pequenas",
    desc: "Ferramenta leve para laboratórios, startups e equipes AppSec iniciantes — sem complexidade enterprise.",
    color: "#eab308",
  },
  {
    icon: Lock,
    title: "Segurança Robusta",
    desc: "Autenticação bcrypt, JWT HttpOnly, rate limiting, CORS, Helmet e proteção IDOR herdados do projeto base.",
    color: "#ec4899",
  },
];

const SECURITY = [
  "Segredos via variáveis de ambiente",
  "Hash bcrypt (12 rounds)",
  "Cookie seguro (httpOnly, sameSite lax)",
  "Proteção IDOR (404 em vez de 403)",
  "Rate limiting global e em auth",
  "CORS + Helmet configurados",
  "Timing attack prevention",
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  if (!loading && isAuthenticated) {
    window.location.href = "/dashboard";
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-12 border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0">
        <BrandLogo showSubtitle={false} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/login")}
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Entrar
          </button>
          <button
            onClick={() => navigate("/register")}
            className="text-xs font-mono bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Criar Conta
          </button>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-4 md:px-6 py-16 md:py-24 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs font-mono text-primary mb-6">
            <ClipboardCheck className="w-3.5 h-3.5" />
            Trilha 1 — AppHardener
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-mono text-foreground leading-tight">
            Diagnóstico e Hardening<br />
            <span className="text-primary">de Aplicações Web</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-4 max-w-2xl mx-auto leading-relaxed">
            O SecureForge Web ajuda equipes a identificar fragilidades de segurança, aplicar checklists
            estruturados e organizar um processo simples de melhoria — orientado à correção, não apenas ao scanning.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-mono hover:bg-primary/90 transition-colors"
            >
              Começar agora <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-mono text-muted-foreground hover:text-foreground border border-border px-5 py-2.5 rounded-lg transition-colors"
            >
              Já tenho conta
            </button>
          </div>
        </section>

        <section className="px-4 md:px-6 py-12 border-t border-border/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-6 text-center">
              Categorias de Análise
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {CATEGORIES.map(({ label, color, desc }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                  <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: color }} />
                  <p className="text-xs font-mono font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 md:px-6 py-12 border-t border-border/50">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 border"
                  style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <h3 className="text-sm font-mono font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 md:px-6 py-12 border-t border-border/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-4 text-center">
              Controles de Segurança da Plataforma
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {SECURITY.map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/30 border border-border rounded-full px-3 py-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-4 text-center">
        <p className="text-xs font-mono text-muted-foreground">
          SecureForge Web · Projeto Integrador · Segurança Aplicada · Trilha 1 AppHardener
        </p>
      </footer>
    </div>
  );
}
