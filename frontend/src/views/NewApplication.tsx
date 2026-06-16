import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NewApplication() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [techStack, setTechStack] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = trpc.applications.create.useMutation({
    onSuccess: (app) => {
      toast.success("Aplicação cadastrada!");
      navigate(`/applications/${app.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Nome deve ter pelo menos 2 caracteres.");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      baseUrl: baseUrl.trim() || null,
      techStack: techStack.trim() || null,
      description: description.trim() || null,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/applications")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground font-mono">Nova Aplicação</h1>
            <p className="text-sm text-muted-foreground">Cadastre um projeto web para análise</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div>
            <Label className="text-xs font-mono">Nome *</Label>
            <Input
              className="mt-1 font-mono text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Portal do Cliente"
              maxLength={255}
              required
            />
          </div>
          <div>
            <Label className="text-xs font-mono">URL base</Label>
            <Input
              className="mt-1 font-mono text-sm"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://app.exemplo.com"
              type="url"
            />
          </div>
          <div>
            <Label className="text-xs font-mono">Stack tecnológica</Label>
            <Input
              className="mt-1 font-mono text-sm"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="Ex.: React + Node.js + PostgreSQL"
              maxLength={255}
            />
          </div>
          <div>
            <Label className="text-xs font-mono">Descrição</Label>
            <Textarea
              className="mt-1 font-mono text-sm min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contexto da aplicação, ambiente, observações..."
              maxLength={5000}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={createMutation.isPending} className="font-mono text-xs">
              {createMutation.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
            <Button type="button" variant="outline" className="font-mono text-xs" onClick={() => navigate("/applications")}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
