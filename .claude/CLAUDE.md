# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🏍️ Project Overview

**HG Motors — Sistema Operacional Interno** - Sistema web interno para centralizar a
operação de uma retífica de motores de motocicletas através da Ordem de Serviço
(OS). Toda etapa do fluxo operacional (cliente → OS → serviços → orçamento →
execução → qualidade → entrega → pagamento) gera dados estruturados que
alimentam automaticamente o dashboard de indicadores gerenciais — nenhum KPI é
digitado manualmente (ver seção "Regra de ouro" abaixo).

Objetivos do produto (não apenas um CRUD): organização, rastreabilidade,
produtividade, controle de prazos, qualidade, faturamento, gestão de equipe,
redução da dependência do proprietário e geração automática de indicadores.
A arquitetura é modular para permitir expansão futura (CRM, estoque,
financeiro completo, WhatsApp, automações, IA, portal do cliente).

- **Tech Stack**: Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS 4 + Prisma 6 + SQLite
- **Auth**: sessão própria via cookie assinado (HMAC/scrypt, sem dependências externas) — ver `app/lib/auth.ts` e `app/lib/password.ts`
- **Proteção de rotas**: `proxy.ts` na raiz (Next 16 renomeou `middleware.ts` → `proxy.ts`)

> Este projeto já teve uma versão anterior como "Sistema de Controle
> Financeiro" pessoal (casal). Ela foi substituída integralmente pelo sistema
> operacional da HG Motors descrito aqui.

## ⚠️ Next.js 16 — leia antes de programar

Este repositório está no Next.js 16, que trouxe mudanças relevantes para como
o código é escrito aqui. A documentação completa vem empacotada em
`node_modules/next/dist/docs/` — consulte especialmente
`01-app/02-guides/upgrading/version-16.md` antes de mudanças estruturais.
Pontos que afetam este projeto:

- **`params` e `cookies()`/`headers()` são sempre assíncronos** (`await`). Toda
  rota dinâmica (`app/api/**/[id]/route.ts`) tipa o contexto como
  `{ params: Promise<{ id: string }> }` e faz `const { id } = await ctx.params`.
- **`middleware.ts` foi renomeado para `proxy.ts`**, com a função exportada
  chamada `proxy` (não `middleware`). Roda em runtime Node.js (não mais Edge),
  o que permite usar `crypto` nativo do Node livremente no arquivo de proxy.
- Turbopack é o padrão para `dev`/`build` (scripts do `package.json` não
  precisam de `--turbopack`).

## 🏗️ Project Structure

```
.
├── proxy.ts                          # Proteção de rotas (sessão) — Next 16
├── prisma/
│   ├── schema.prisma                 # Modelo de dados (ver abaixo)
│   ├── seed.ts                       # Categorias padrão + usuários iniciais
│   └── migrations/
├── app/
│   ├── api/
│   │   ├── auth/{login,logout,me}/route.ts
│   │   ├── clients/[id]?/route.ts        # CRUD + classificação computada
│   │   ├── employees/[id]?/route.ts      # CRUD + produtividade individual
│   │   ├── categories/[id]?/route.ts     # Categorias de serviço
│   │   ├── orders/route.ts               # Lista (com filtros) + criação rápida de OS
│   │   ├── orders/[id]/route.ts          # Detalhe + edição de campos gerais
│   │   ├── orders/[id]/status/route.ts   # Transição de status (grava timeline)
│   │   ├── orders/[id]/services/[serviceId]?/route.ts
│   │   ├── orders/[id]/budget/route.ts   # Orçamento (status, desconto)
│   │   ├── orders/[id]/payment/route.ts  # Pagamento
│   │   ├── orders/[id]/photos/route.ts   # Upload de fotos (public/uploads)
│   │   ├── orders/[id]/rework/route.ts   # Marcar retrabalho
│   │   ├── interventions/route.ts        # Intervenções do proprietário
│   │   ├── goals/route.ts                # Metas mensais
│   │   └── dashboard/route.ts            # KPIs calculados (ver abaixo)
│   ├── components/
│   │   ├── AppShell.tsx               # Shell com abas por papel + modais
│   │   ├── DashboardTab.tsx           # Indicadores (todos calculados)
│   │   ├── KanbanTab.tsx              # Quadro operacional (drag & drop nativo)
│   │   ├── NewOrderModal.tsx          # Criação rápida de OS
│   │   ├── OrderModal.tsx             # Detalhe da OS (visão geral, serviços,
│   │   │                                orçamento/pagamento, fotos, timeline)
│   │   ├── ClientsTab.tsx / EmployeesTab.tsx / SettingsTab.tsx
│   │   └── ui.tsx                     # Modal, StatusBadge, StatCard, etc.
│   ├── lib/
│   │   ├── prisma.ts                  # Cliente Prisma singleton
│   │   ├── auth.ts / password.ts      # Sessão (cookie assinado) e hash de senha
│   │   ├── api-auth.ts                # requireSession(allowedRoles?) para Route Handlers
│   │   ├── constants.ts               # Enums de domínio (SQLite não tem enum nativo)
│   │   ├── orders.ts                  # changeOrderStatus() — timeline + auditoria + efeitos colaterais
│   │   ├── audit.ts                   # logAudit() — histórico de alterações sensíveis
│   │   ├── metrics.ts                 # computeOrderValue, getPeriodRange, avg/median
│   │   ├── format.ts                  # Formatação pt-BR (moeda, datas, %)
│   │   └── types.ts                   # Tipos compartilhados com o frontend
│   ├── login/page.tsx
│   └── page.tsx                       # Renderiza <AppShell />
└── public/uploads/orders/<id>/...     # Fotos anexadas às OS
```

## 🗄️ Modelo de dados (Prisma)

SQLite não suporta `enum` nativo no Prisma — todos os campos de
status/categoria são `String`, validados em runtime contra as listas de
`app/lib/constants.ts` (`isIn()`).

- **User**: proprietário / gestor (Denner) / funcionário. `role`, `position`,
  `skills`, `active`. Também representa o "funcionário" para atribuição de
  serviços e produtividade.
- **Client**: pessoa física, oficina, loja, parceiro. Classificação
  (novo/recorrente/inativo/oficina-parceiro) é **computada** a partir do
  histórico de OS, nunca armazenada.
- **ServiceCategory**: Cabeçote, Cilindro, Virabrequim, Carcaça, Usinagem,
  Medição, Montagem/Desmontagem, Outro (seed) — extensível via Configurações.
- **ServiceOrder** (núcleo do sistema): dados do motor, status do fluxo,
  prioridade, orçamento (desconto + status + datas), execução, pagamento.
  `id` é `Int @default(autoincrement())` e serve como número da OS (exibido
  como `OS-000123` via `osCode()`).
- **ServiceItem**: serviços dentro de uma OS (categoria, valor, responsável,
  prioridade, prazo, status).
- **StatusHistory**: timeline automática (toda mudança de status é
  registrada por `changeOrderStatus()`).
- **Photo**: fotos anexadas, classificadas por etapa.
- **Rework**: retrabalhos (motivo, responsável, custo estimado) — alimenta a
  taxa de retrabalho.
- **OwnerIntervention**: "Intervenções do Proprietário" — dependência do
  proprietário, objetivo estratégico é reduzir ao longo do tempo.
- **Goal**: metas mensais (faturamento, nº de OS, ticket médio, conversão,
  retrabalho máximo, prazo médio máximo) para comparação Realizado × Meta.
- **AuditLog**: auditoria de alterações sensíveis (valor, prazo, status,
  responsável, cancelamento, aprovação, pagamento) via `logAudit()`.

### Fluxo de status da OS

```
ENTRADA → AGUARDANDO_AVALIACAO → ORCAMENTO → AGUARDANDO_APROVACAO → APROVADO
  → AGUARDANDO_EXECUCAO → EM_EXECUCAO → AGUARDANDO_CLIENTE → CONTROLE_QUALIDADE
  → PRONTO → ENTREGUE → FINALIZADO
```

Status especiais (fora da sequência linear): `CANCELADO`, `RETRABALHO`,
`BLOQUEADO`. Toda transição passa por `changeOrderStatus()` em
`app/lib/orders.ts`, que grava `StatusHistory` + `AuditLog` e aplica efeitos
colaterais (marca `executionStartedAt`, `deliveredAt`, etc. automaticamente).

## 🔑 Regra de ouro dos indicadores

**Nenhum indicador é digitado manualmente se puder ser calculado pelo
sistema.** `app/api/dashboard/route.ts` deriva faturamento, ticket médio,
taxa de conversão, taxa de retrabalho, tempo médio de execução, prazo médio,
entregas no prazo, produtividade por funcionário e faturamento por serviço —
tudo a partir de `ServiceOrder`/`ServiceItem`/`Rework`/`OwnerIntervention`.
Ao adicionar um novo indicador, calcule-o em `app/lib/metrics.ts` /
`app/api/dashboard/route.ts` em vez de criar um campo para digitá-lo.

## 👤 Papéis e permissões

- **PROPRIETARIO**: acesso completo (financeiro, permissões, relatórios).
- **GESTOR** (Denner): operação ampla (OS, status, equipe, retrabalho), sem
  necessariamente ver informações financeiras estratégicas do proprietário.
- **FUNCIONARIO**: vê/atualiza apenas os serviços atribuídos a ele.

Aplicado em duas camadas: `proxy.ts` garante que só usuários autenticados
acessam a aplicação; `requireSession(allowedRoles)` em cada Route Handler
garante a regra fina por papel. No frontend, `AppShell` esconde abas
(Equipe/Configurações) para quem não é proprietário/gestor.

## 🚀 Comandos comuns

```bash
npm install
npm run dev              # http://localhost:3000 (Turbopack)
npx prisma migrate dev --name <nome>
npx prisma db seed       # recria categorias + usuários iniciais (idempotente)
npx prisma studio
npm run build
npm start
npm run lint
```

### Usuários de exemplo (seed)

Senha padrão para todos: `hgmotors123` (troque em produção).

- `proprietario@hgmotors.com.br` — PROPRIETARIO
- `denner@hgmotors.com.br` — GESTOR
- `tecnico@hgmotors.com.br` — FUNCIONARIO

## 🛠️ Fluxo de desenvolvimento

Ao adicionar funcionalidades, siga o núcleo do produto primeiro:
`CLIENTE → OS → SERVIÇO → STATUS → CONCLUSÃO → FATURAMENTO → DASHBOARD`.

1. **Schema**: edite `prisma/schema.prisma`, rode `npx prisma migrate dev`.
2. **Backend**: rota em `app/api/**/route.ts`, usando `requireSession()` e,
   para qualquer alteração sensível, `logAudit()`.
3. **Frontend**: componente em `app/components/`, tipado a partir de
   `app/lib/types.ts`.
4. **Teste**: `npm run build && npm run lint`, depois `npm run dev` e
   interaja pelo navegador.

## 📝 Notas para desenvolvimento futuro (fora do MVP atual)

- Relatórios dedicados com exportação CSV/Excel (hoje cobertos pelo
  dashboard, mas sem exportação).
- Central de pendências/alertas unificada (hoje os sinais existem nos dados —
  OS atrasada, orçamento pendente, retrabalho — mas não há uma tela única).
- Financeiro completo (contas a pagar/receber, custos operacionais, margem e
  lucro — hoje não há custos cadastrados, então margem/lucro não são
  calculados).
- Portal do cliente, WhatsApp, estoque, compras, fornecedores, IA — módulos
  futuros previstos na arquitetura, não implementados neste MVP.
- Testes automatizados (jest/vitest) — ainda não configurados.
