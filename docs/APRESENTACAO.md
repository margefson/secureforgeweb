# Apresentação — SecureForge Web

Roteiro de slides para entrega final (Trilha 1 — AppHardener).

---

## Slide 1 — Capa

**SecureForge Web**  
Diagnóstico e Hardening de Aplicações Web  
Projeto Integrador · Segurança Aplicada · Trilha 1

---

## Slide 2 — Problema

- Equipes pequenas não possuem fluxo estruturado para revisar postura de segurança
- Scanners automatizados geram ruído sem orientação à correção
- Falta rastreabilidade entre checklist, achados e plano de ação

---

## Slide 3 — Solução

Assistente guiado que conecta:

```
Aplicação → Análise (checklist OWASP) → Achados → Recomendações → Dashboard → PDF
```

---

## Slide 4 — Escopo funcional

| RF | Entrega |
|---|---|
| RF01 | Cadastro de aplicações (URL e/ou repositório Git) |
| RF02 | Checklist OWASP v1.0 (24 itens) |
| RF03–RF05 | Achados, severidade, recomendações |
| RF06–RF07 | Dashboard + relatório PDF |
| RF08 | Fluxo de status dos achados |
| Extra | Análises automáticas assistidas (HTTP, Git, IA) |

---

## Slide 5 — Arquitetura

- **Frontend:** React 19 + Vite + tRPC client
- **Backend:** Express + tRPC + Drizzle ORM
- **Banco:** PostgreSQL 16
- **PDF:** PDFKit (Node.js)
- **Assistente IA:** OpenAI API (opcional) + heurísticas locais

---

## Slide 6 — Checklist OWASP

9 categorias · 24 controles · seed versionado v1.0

Autenticação · Autorização · Validação · Segredos · Headers · Exposição · Erros · Dados · Superfície

---

## Slide 7 — Análises automáticas assistidas

Três modalidades, executáveis **por categoria** ou **por item**:

| Modalidade | Evidência |
|---|---|
| Headers HTTP | Fetch passivo da URL base |
| Repositório Git | Clone + heurísticas de código |
| Assistente IA | Contexto HTTP + Git + LLM/heurístico |

Princípio: a automação **sugere**, o analista **valida**.

---

## Slide 8 — Fluxo de análise

1. Cadastrar aplicação (URL e/ou repo Git)
2. Wizard por categoria — análises automáticas opcionais
3. Salvamento parcial e navegação livre entre categorias
4. Conclusão gera achados automaticamente
5. Revisar recomendações e atualizar status

---

## Slide 9 — Dashboard de postura

- **Score:** % itens conformes + N/A
- **Gráficos:** severidade e categoria
- **Taxa de resolução:** achados resolvidos / total
- **Histórico:** múltiplas análises por aplicação
- **PDF:** exportável em múltiplas telas

---

## Slide 10 — Relatório PDF

- Identificação da aplicação
- Resumo executivo
- Plano de ação priorizado por severidade
- Recomendações de hardening

---

## Slide 11 — Segurança da plataforma

- bcrypt (12 rounds) · JWT HttpOnly · Rate limiting
- CORS + Helmet · Proteção IDOR (404)
- Timing attack prevention · Validação Joi

---

## Slide 12 — Demo ao vivo

Seguir roteiro em [DEMO.md](DEMO.md) — Portal Acadêmico Lab (~15 min)

Destaques: análise Git + assistente IA por categoria + revisão humana + PDF

---

## Slide 13 — Conclusão

- Protótipo demonstrável ponta a ponta
- Checklist OWASP + achados + dashboard + PDF + análises assistidas
- Evolução futura: integração CI/CD, repositórios privados, persistência de metadados IA

**Repositório:** https://github.com/margefson/secureforgeweb

---

## Gravação de vídeo demo (opcional)

1. Gravar tela seguindo [DEMO.md](DEMO.md)
2. Duração alvo: 8–15 minutos
3. Narração: problema → solução → análises automáticas → achados → dashboard → PDF
