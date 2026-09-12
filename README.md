# HG Motors — Sistema Operacional Interno

Sistema web interno para centralizar a operação de uma retífica de motores de
motocicletas através da Ordem de Serviço (OS): cadastro de clientes, criação
de OS, serviços, orçamento, fluxo de status com timeline automática, fotos,
quadro Kanban, gestão de equipe e um dashboard de indicadores 100% calculado
a partir dos dados operacionais.

Veja `.claude/CLAUDE.md` para a documentação técnica completa (modelo de
dados, arquitetura, papéis/permissões e fluxo de desenvolvimento).

## Como rodar

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Usuários de exemplo
(senha `hgmotors123`):

- `proprietario@hgmotors.com.br` — Proprietário
- `denner@hgmotors.com.br` — Gestor
- `tecnico@hgmotors.com.br` — Funcionário

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS 4 · Prisma 6 ·
SQLite.
