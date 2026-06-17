# Roteiro de Demonstração — SecureForge Web

Roteiro para apresentação acadêmica (~15–18 minutos). Use uma aplicação de laboratório fictícia ou um repositório público real para as análises automáticas.

---

## Pré-requisitos

```powershell
# 1. Configure o .env (copie de .env.example)
#    DATABASE_URL, JWT_SECRET, FRONTEND_URL, VITE_API_PROXY_TARGET

# 2. Suba o banco, migrações e seed do checklist OWASP
pnpm db:setup

# 3. Inicie frontend + backend
pnpm dev
```

Acesse: **http://localhost:5173**

| Item | Detalhe |
|---|---|
| Conta demo | Crie em **Criar Conta** (ex.: `demo@secureforgeweb.local`) ou use usuário existente |
| Assistente IA (LLM) | Opcional — configure `OPENAI_API_KEY` no `.env`. Sem chave, o assistente usa heurísticas locais |
| Análises automáticas | Exigem **URL base** e/ou **repositório Git** cadastrados na aplicação |

---

## Cenário sugerido: Portal Acadêmico Lab

| Campo | Valor sugerido |
|---|---|
| Nome | Portal Acadêmico Lab |
| URL base | `https://portal-lab.universidade.edu` *(ou URL pública real para demo de headers)* |
| Repositório Git | `https://github.com/OWASP/NodeGoat` *(repositório público HTTPS para análise de código)* |
| Stack | React + Node.js + PostgreSQL |
| Descrição | Sistema de matrículas e notas para demonstração acadêmica |

> Pelo menos **URL base** ou **repositório Git** é obrigatório no cadastro — ideal preencher ambos para demonstrar todas as análises automáticas.

---

## Roteiro (15–18 min)

### 1. Landing e contexto (2 min)

- Abrir `/` — apresentar proposta da Trilha 1 **AppHardener**
- Destacar o fluxo: **aplicação → checklist OWASP → achados → hardening → dashboard → PDF**
- Fazer **login** e mostrar o menu: Dashboard, Aplicações, Postura de Segurança

### 2. Cadastro da aplicação (2 min)

- **Aplicações → Nova Aplicação**
- Preencher dados do Portal Acadêmico Lab (incluindo URL e repositório Git)
- Salvar — abrir o **detalhe da aplicação**
- Mostrar atalhos: **Iniciar análise**, **Dashboard de postura**, **Exportar PDF**, **Ver achados**

### 3. Wizard de checklist e análises automáticas (7 min)

- Clicar em **Iniciar análise**
- Apresentar as **9 categorias OWASP** (24 itens) e a barra de progresso geral

#### 3.1 Análises por categoria (independentes)

Em cada categoria, os botões aparecem conforme o tipo de item:

| Botão | Quando aparece | O que faz |
|---|---|---|
| **Analisar headers HTTP** | Categoria com itens de headers/HTTPS | Pré-preenche via fetch passivo da URL base |
| **Analisar repositório Git** | Categoria com itens de código (AUTH, INPUT, etc.) | Pré-preenche via clone + heurísticas estáticas |
| **Assistente IA (categoria)** | Sempre (se houver URL ou repo) | Sugere conformidade para todos os itens da categoria |

**Demonstrar ao vivo:**

1. Abrir **Headers de segurança** → **Analisar headers HTTP** → revisar sugestões com badge de confiança
2. Abrir **Validação de entrada** → **Analisar repositório Git** → mostrar sugestão automática (ex.: INPUT-02)
3. Abrir **Exposição de endpoints** → **Assistente IA (categoria)** → mostrar badge roxo **Sugestão IA**

#### 3.2 Assistente IA por item

- Em um item específico (ex.: `AUTH-02`), clicar **Assistente IA** no canto do card
- Explicar que cada item pode ser analisado **isoladamente**, sem afetar os demais

#### 3.3 Revisão humana e salvamento

- Enfatizar: *“A sugestão não substitui validação humana — o analista confirma ou ajusta.”*
- Ajustar manualmente 2–3 itens, por exemplo:
  - `AUTH-02` — **Não conforme** (senhas em texto plano)
  - `HEADER-01` — **Parcial** (CSP incompleto)
  - `INPUT-02` — **Conforme** (queries parametrizadas)
- Mostrar **Salvar categoria** (salva respostas parciais)
- Trocar de aba (ex.: Autenticação → Headers) — respostas salvas automaticamente ao mudar de categoria
- Percorrer mais 1–2 categorias; usar **Salvar e continuar** quando a categoria estiver completa
- No resumo final, clicar **Concluir e gerar achados**

### 4. Achados e hardening (3 min)

- Redirecionamento para **lista de achados** da aplicação
- Filtrar por severidade ou status
- Abrir achado **crítico/alto** — mostrar recomendação de hardening e evidência
- Alterar status para **Em correção**
- Se achado for crítico, mostrar **notificação** (ícone de sino no topo)

### 5. Dashboard e PDF (3 min)

- Abrir **Dashboard de postura** da aplicação (`/applications/:id/dashboard`)
- Explicar **score de conformidade**, gráficos por severidade/categoria e taxa de resolução
- Clicar **Exportar PDF** — abrir arquivo e mostrar resumo executivo + plano de ação
- Opcional: no **Dashboard global** (`/dashboard`), exportar PDF de outra aplicação da lista

### 6. Encerramento (1 min)

- Visão consolidada em **Postura de Segurança** / Dashboard global
- Se perfil **admin**: mencionar gestão de usuários e itens OWASP em `/admin`
- Fechar reforçando alinhamento OWASP/ASVS e revisão humana das sugestões automáticas

---

## Itens para destacar na banca

1. Checklist OWASP v1.0 — **24 itens em 9 categorias**, referências ASVS
2. **Análises automáticas** em três modalidades: headers HTTP, repositório Git e assistente IA
3. IA **por categoria e por item**, executável de forma independente
4. Salvamento **parcial** e navegação livre entre categorias sem perda de dados
5. Geração automática de **achados** a partir de não conformidades
6. **Recomendações de hardening** vinculadas ao catálogo OWASP
7. **Score de postura** calculado objetivamente + **relatório PDF** exportável
8. Controles de segurança da plataforma (bcrypt, IDOR, rate limit, Helmet)

---

## Roteiro alternativo (demo rápida — 8 min)

1. Login → cadastrar aplicação com URL + repo (1 min)
2. Wizard: 1 análise Git + 1 assistente IA por categoria + revisão manual (3 min)
3. Concluir → achados → alterar status (2 min)
4. Dashboard + PDF (2 min)

---

## Checklist pré-demo

- [ ] PostgreSQL rodando e `DATABASE_URL` no `.env`
- [ ] `pnpm db:setup` executado (checklist seed com 24 itens)
- [ ] `pnpm dev` ativo (frontend :5173, backend :3000)
- [ ] Conta criada e login testado
- [ ] Aplicação demo cadastrada com **URL base** e **repositório Git** público
- [ ] *(Opcional)* `OPENAI_API_KEY` configurada para modo LLM do assistente IA
- [ ] Navegador em tela limpa (sem abas irrelevantes)
- [ ] Download de PDF testado uma vez antes da apresentação

---

## Solução de problemas durante a demo

| Situação | Ação |
|---|---|
| Botões de análise desabilitados | Verifique URL base e/ou repositório Git no cadastro da aplicação |
| Clone Git falha | Use repositório **público HTTPS**; evite URLs duplicadas no campo |
| Assistente IA sem respostas | Confirme URL ou repo acessíveis; sem `OPENAI_API_KEY` usa heurísticas |
| Score aparece como "—" | Conclua uma análise com **todos** os 24 itens respondidos |
| PDF não baixa | Verifique permissões de download do navegador |

Apresentação em slides: [APRESENTACAO.md](APRESENTACAO.md) · Manual completo: [MANUAL.md](MANUAL.md)
