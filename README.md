# SecureForge Web

**Plataforma de Diagnóstico e Hardening de Aplicações Web**

Projeto da Trilha 1 — AppHardener (Projeto Integrador: Segurança Aplicada).

**Repositório:** https://github.com/margefson/secureforgeweb

![SecureForge Web](frontend/public/logo.png)

## Status atual

Protótipo **funcional e demonstrável** — Entrega 2 concluída (16/06/2026):

- PostgreSQL como banco principal (Drizzle ORM)
- Autenticação (registro, login, perfil, admin de usuários)
- **Cadastro de aplicações web** (CRUD — URL base e/ou repositório Git)
- **Checklist OWASP v1.0** (24 itens em 9 categorias, com seed)
- **Análise guiada** com wizard por categoria, salvamento parcial e geração automática de achados
- **Análises automáticas assistidas:** headers HTTP, repositório Git e assistente IA (por categoria e por item)
- **Achados de segurança** com severidade, recomendações, status e histórico
- **Dashboard de postura** com score, gráficos e taxa de resolução
- **Relatório PDF** exportável (dashboard global, detalhe e dashboard da aplicação)
- **Admin:** gestão de itens do checklist e notificações para achados críticos

Identidade visual: [docs/BRAND.md](docs/BRAND.md)

---

## Pré-requisitos

| Ferramenta | Versão mínima | Verificação |
|---|---|---|
| Node.js | 22.x | `node --version` |
| pnpm | 10.x | `pnpm --version` |
| PostgreSQL | 16+ | `psql --version` ou Docker |
| Git | qualquer | `git --version` |

**Opcional:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) para subir o PostgreSQL sem instalação local.

**Opcional (assistente IA com LLM):** chave `OPENAI_API_KEY` no `.env` — sem ela, o assistente usa heurísticas locais.

---

## Passo a passo — rodar localmente (Windows)

### 1. Clonar e entrar no projeto

```powershell
git clone https://github.com/margefson/secureforgeweb.git
cd secureforgeweb
```

### 2. Instalar dependências

```powershell
pnpm install
```

### 3. Configurar variáveis de ambiente

```powershell
Copy-Item .env.example .env
```

Edite o arquivo `.env` na raiz do projeto. O mínimo necessário:

```env
DATABASE_URL=postgresql://secureforgeweb_user:secureforgeweb_pass@localhost:5432/secureforgeweb
JWT_SECRET=sua_chave_secreta_com_pelo_menos_32_caracteres_aleatorios
PORT=3000
FRONTEND_URL=http://localhost:5173
VITE_API_PROXY_TARGET=http://localhost:3000
```

> **Importante:** `JWT_SECRET` deve ter no mínimo 32 caracteres. Sem ele, o servidor não inicia.

---

### 4. Subir o PostgreSQL

Escolha **uma** das opções abaixo.

#### Opção A — Docker (recomendado)

```powershell
docker compose up -d
```

Ou use o script automatizado:

```powershell
.\scripts\setup-local-db.ps1
```

#### Opção B — PostgreSQL já instalado no Windows

```powershell
psql -U postgres -f scripts/init-postgres.sql
```

> Se preferir usar seu usuário `postgres` existente, altere no `.env`:
> `DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/secureforgeweb`

---

### 5. Criar tabelas e popular o checklist

```powershell
pnpm db:setup
```

---

### 6. Iniciar a aplicação

```powershell
pnpm dev
```

| Serviço | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **API (tRPC)** | http://localhost:3000/api/trpc |
| **Health check** | http://localhost:3000/api/health |

O health check deve retornar:

```json
{
  "ok": true,
  "service": "secure-forge-web-api",
  "database": "connected"
}
```

---

### 7. Testar no navegador

1. Acesse http://localhost:5173
2. Crie uma conta e faça login
3. Cadastre uma aplicação em **Aplicações → Nova Aplicação** (informe URL base **e/ou** repositório Git)
4. Inicie uma **análise de segurança** e percorra o wizard de checklist
5. Use as **análises automáticas** por categoria ou por item; revise e salve as respostas
6. Conclua a análise, gerencie achados e exporte o **relatório PDF**

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `pnpm dev` | Backend (:3000) + frontend (:5173) com hot reload |
| `pnpm build` | Build de produção |
| `pnpm check` | Verificação TypeScript |
| `pnpm test` | Testes Vitest |
| `pnpm db:setup` | Aguarda DB + migrações + seed do checklist |

---

## Documentação do projeto

| Documento | Conteúdo |
|---|---|
| [docs/MANUAL.md](docs/MANUAL.md) | Manual de uso |
| [docs/DEMO.md](docs/DEMO.md) | Roteiro de demonstração |
| [docs/APRESENTACAO.md](docs/APRESENTACAO.md) | Roteiro de slides |
| [docs/RELATORIO_ENTREGA_2.md](docs/RELATORIO_ENTREGA_2.md) | Relatório da Entrega 2 (estado atual) |
| [docs/PROJETO_ARQUITETURAL.md](docs/PROJETO_ARQUITETURAL.md) | Arquitetura alvo |
| [docs/GUIA_IMPLEMENTACAO.md](docs/GUIA_IMPLEMENTACAO.md) | Cronograma e reaproveitamento |
| [docs/BRAND.md](docs/BRAND.md) | Logo e identidade visual |

Índice completo: [docs/README.md](docs/README.md)

## Stack

React 19 · Vite 7 · Tailwind 4 · tRPC 11 · Express · Drizzle ORM · PostgreSQL 16

## Licença

MIT
