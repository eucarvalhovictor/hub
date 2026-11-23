# Hub — Painel administrativo

Sistema de gestão completo para freelancers e agências digitais: **clientes, finanças, CRM, hábitos, metas, tarefas, notas e vida pessoal** em um só lugar.

## Stack

- **Next.js 14+** (App Router) + TypeScript (estrito, sem `any`)
- **Tailwind CSS** + componentes estilo shadcn/ui (customizados no design system)
- **Supabase** (Postgres, Auth e-mail/senha, Row Level Security, Storage)
- **Recharts** para gráficos
- **@dnd-kit** para drag & drop (Kanban)
- **React Hook Form + Zod** para formulários
- **TanStack Query** para dados
- **lucide-react** para ícones (traço fino, 16px)
- **date-fns** (locale pt-BR)

## Design system

- Inspiração Notion: muito espaço em branco, zero sombras pesadas, bordas finas.
- Tipografia: Inter (fallback system), corpo 14px, H1 página 40px/700, H2 24px/600, H3 18px/600, metadados 12px.
- Cores claras: fundo `#FFFFFF`, sidebar `#F7F6F3`, texto `#37352F`, acento `#2383E2`.
- Cores escuras (toggle no topo): fundo `#191919`, sidebar `#202020`, texto `rgba(255,255,255,0.81)`.
- Radius: 4px (botões/inputs), 6px (cards/popovers/modais), badges 3px.
- Sidebar fixa (240px, colapsável), mobile vira drawer.
- Atalhos: `Ctrl/Cmd + K` busca global, `C` novo item na tela atual, `G` + letra para navegar (`G H` Hoje, `G C` Clientes, `G M` CRM, `G F` Financeiro, `G T` Tarefas, `G G` Metas, `G A` Hábitos, `G N` Notas, `G D` Diário, `G S` Configurações).

## Módulos

1. **Hoje** — saudação por horário, frase do dia (determinística por data a partir da tabela `quotes`, com 165 frases no seed, favoritos por usuário e botão "Outra frase"), cards-resumo, gráfico receita x despesa (6 meses), hábitos/tarefas/metas do dia.
2. **Clientes** — lista com busca/filtros, detalhe com abas (Visão geral · Contratos e financeiro · CRM/Interações · Projetos/Tarefas · Arquivos · Notas). Contratos com parcelas e ação rápida "Marcar paga".
3. **CRM** — Kanban com drag & drop, interações, follow-ups, criação automática de contrato ao fechar.
4. **Financeiro** — por cliente (contratos + parcelas) e geral (PJ/Pessoal), contas, categorias, orçamento, fluxo de caixa, projeções, CSV. Views: `client_financial_summary`, `overdue_installments`, `monthly_cashflow`.
5. **Metas** — por área, marcos, progresso, revisões semanais/mensais.
6. **Hábitos** — frequências, streaks, heatmap, taxa de conclusão.
7. **Tarefas** — Lista/Kanban, prioridades, prazos, recorrência.
8. **Notas e Diário** — Markdown simples, diário rápido (humor, gratidões, destaque).

## Setup

### 1. Supabase

```bash
# clonar/linkar o projeto
supabase link --project-ref <seu-projeto>
supabase db push
supabase gen types typescript --linked --schema public > src/lib/types/database.ts
supabase storage create client-assets
```

### 2. Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

### 3. Banco

As migrations estão em `supabase/migrations/`:

- `20240101000000_init.sql` — schema completo (tabelas, enums, RLS, índices, views, triggers, seed de categorias/estágios/frases).

### 4. Desenvolvimento

```bash
npm run dev
```

## Rotas principais

- `/` — Hoje (dashboard)
- `/login`
- `/clients` — lista e `/clients/[id]` — detalhe
- `/crm` — kanban
- `/finance` — geral e por cliente
- `/habits`, `/goals`, `/tasks`, `/notes`, `/journal`, `/settings`

## Deploy

Deploy na Vercel: importe o repositório, configure as variáveis de ambiente e faça deploy.

## Decisões de escopo

- As criações principais (clientes, oportunidades, lançamentos, tarefas, metas, hábitos e notas) usam diálogos conectados ao Supabase com `user_id` + RLS.
- As views de resumo financeiro são iniciais; recomenda-se aplicar o padrão de função `security definer` para RLS adequado em produção.
- O tipo `Database` é escrito à mão em `src/lib/types/database.ts`; ao evoluir o schema, rode `supabase gen types typescript --linked --schema public > src/lib/types/database.ts` para regenerar.
