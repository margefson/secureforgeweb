# Manual de Uso — SecureForge Web

Plataforma de diagnóstico e hardening de aplicações web (Trilha 1 — AppHardener).

---

## 1. Acesso ao sistema

1. Acesse a URL do frontend (ex.: http://localhost:5173)
2. Clique em **Criar Conta** ou **Entrar**
3. Após login, você será redirecionado ao **Dashboard**

---

## 2. Cadastrar uma aplicação

1. Menu **Aplicações** → **Nova Aplicação**
2. Preencha:
   - **Nome** (obrigatório)
   - **URL base** (ex.: `https://app.exemplo.com`)
   - **Repositório Git** (ex.: `https://github.com/org/projeto` — repositório público HTTPS)
   - **Stack tecnológica** (opcional, ex.: React + Node)
   - **Descrição** (opcional)
3. **Pelo menos URL base ou repositório Git** deve ser informado — necessário para habilitar análises automáticas
4. Salve — a aplicação aparecerá na lista

---

## 3. Executar análise de checklist

1. Abra o detalhe da aplicação
2. Clique em **Iniciar análise** (ou **Continuar análise** se houver uma em andamento)
3. No wizard, navegue pelas **9 categorias OWASP** (24 itens) usando as abas no topo
4. Para cada item, selecione a conformidade:
   - Conforme
   - Parcialmente conforme
   - Não conforme
   - Não aplicável
5. Adicione observações quando relevante

### Salvamento e navegação

| Ação | Comportamento |
|---|---|
| **Salvar categoria** | Persiste as respostas já preenchidas (parcial ou completo) |
| **Salvar e continuar** | Exige todos os itens da categoria respondidos e avança para a próxima |
| **Trocar de aba (categoria)** | Salva automaticamente as respostas da categoria atual antes de mudar |
| **Anterior** | Volta à categoria anterior (com salvamento automático) |

> Você pode ir e voltar entre categorias a qualquer momento sem perder respostas já salvas.

6. Após responder todas as categorias, no resumo clique em **Concluir e gerar achados**

---

## 4. Análises automáticas assistidas

As análises automáticas **sugerem** conformidade com base em evidências coletadas. O analista **deve revisar** cada sugestão antes de salvar.

### Por categoria

Em cada categoria, botões disponíveis conforme o tipo de item:

| Botão | Quando aparece | O que analisa |
|---|---|---|
| **Analisar headers HTTP** | Itens de headers/HTTPS | Fetch passivo da URL base cadastrada |
| **Analisar repositório Git** | Itens de código (AUTH, INPUT, etc.) | Clone + heurísticas estáticas do repositório |
| **Assistente IA (categoria)** | Sempre (se houver URL ou repo) | Sugestões para todos os itens da categoria |

### Por item

Cada item possui o botão **Assistente IA** no canto superior direito — executa a análise **apenas naquele item**, de forma independente.

### Sugestões automáticas

- Badge **Sugestão automática** (cyan): análise HTTP ou Git
- Badge **Sugestão IA** (roxo): assistente IA (LLM ou heurístico)
- Exibem **nível de confiança**, evidência e raciocínio
- Ao editar manualmente conformidade ou observações, a sugestão visual é removida daquele item

### Assistente IA — modos de operação

| Modo | Condição |
|---|---|
| **LLM** | `OPENAI_API_KEY` configurada no `.env` do servidor |
| **Heurístico** | Fallback automático sem chave de API |

---

## 5. Gerenciar achados

1. No detalhe da aplicação, clique em **Ver achados**
2. Use filtros por severidade, status e categoria
3. Clique em um achado para ver:
   - Recomendação de hardening
   - Evidência registrada na análise
   - Histórico de alterações de status
4. Atualize o status: **Aberto** → **Em correção** → **Resolvido** (ou **Aceito risco**)

> Achados críticos geram notificação in-app (ícone de sino no topo).

---

## 6. Dashboard de postura

### Visão global (`/dashboard` ou `/posture`)

- Score médio de postura
- Total de achados abertos
- Gráficos consolidados
- Lista de aplicações com atalho ao dashboard individual e **Exportar PDF**

### Por aplicação (`/applications/:id/dashboard`)

- Score de postura da última análise concluída
- Gráficos por severidade e categoria
- Taxa de resolução de achados
- Histórico de análises
- Botão **Exportar PDF**

---

## 7. Relatório PDF

O relatório pode ser exportado em:

- **Dashboard global** — botão PDF por aplicação na lista
- **Detalhe da aplicação** — botão **Exportar PDF**
- **Dashboard da aplicação** — botão **Exportar PDF**

O arquivo inclui:

- Resumo executivo (score, achados, taxa de resolução)
- Distribuição por severidade
- Plano de ação priorizado com recomendações

---

## 8. Administração (perfil admin)

| Função | Caminho |
|---|---|
| Gerenciar usuários e papéis | `/admin/users` |
| Ajustar severidade sugerida dos itens OWASP | `/admin/checklist-items` |

---

## 9. Papéis de usuário

| Papel | Permissões |
|---|---|
| **user** | Suas aplicações, análises, achados e relatórios |
| **security-analyst** | Igual ao user (extensível em versões futuras) |
| **admin** | Acesso a todas as aplicações + painel administrativo |

---

## 10. Solução de problemas

| Problema | Ação |
|---|---|
| API não responde | Verifique `pnpm dev` e `DATABASE_URL` no `.env` |
| Checklist vazio | Execute `pnpm db:setup` |
| Botões de análise desabilitados | Cadastre URL base e/ou repositório Git na aplicação |
| Clone Git falha | Use repositório **público HTTPS**; evite URLs malformadas ou duplicadas |
| Assistente IA sem respostas | Confirme URL/repo acessíveis; sem `OPENAI_API_KEY` usa heurísticas |
| Score aparece como "—" | Conclua uma análise com todos os 24 itens respondidos |
| PDF não baixa | Verifique permissões do navegador para downloads |

Documentação complementar: [DEMO.md](DEMO.md) · [RELATORIO_ENTREGA_2.md](RELATORIO_ENTREGA_2.md)
