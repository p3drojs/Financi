# Fase 2 — Backend: protocolo de execução com dois agentes

Escopo desta fase: **só backend**. Telas e front vêm depois, em plano próprio, e nenhum
documento daqui deve criar arquivo em `apps/mobile/`.

Desenho de referência: [`docs/design-fase-2.md`](../design-fase-2.md). Este diretório é o
plano de execução dele.

## Ondas

```
Onda 0 — Fundação           (1 agente, sozinho, ninguém em paralelo)
   │      schema + migration + stubs + helpers compartilhados
   │      merge em main antes de qualquer outra coisa
   ▼
Onda 1 — Dois agentes em paralelo, worktrees separados
   ├── Agente A: contas, transferências, pagamento
   └── Agente B: previsão, orçamento, metas
   ▼
Onda 2 — Consolidação       (1 agente, depois dos dois merges)
          openapi.yaml, CLAUDE.md, aporte de meta via transferência
```

A onda 0 existe por um motivo específico: **só ela mexe em `schema.prisma` e só ela roda
`prisma migrate`.** Dois agentes gerando migration em paralelo contra o mesmo Postgres local
(porta 5439) produz pastas de migration com timestamps concorrentes e um banco de dev
inconsistente. Por isso a onda 0 cria *todas* as tabelas da fase — inclusive `Budget`, `Goal`
e `GoalContribution`, que só serão usadas na onda 1 — e as ondas seguintes rodam no máximo
`prisma generate`.

## Regras de convivência (não negociáveis)

### 1. Um worktree por agente

Já aconteceu neste repositório de um agente trocar a branch debaixo do outro no meio do
trabalho. Não compartilhem diretório:

```bash
git worktree add ../financi-agente-a -b feat/fase2-contas main
git worktree add ../financi-agente-b -b feat/fase2-previsao-orcamento-metas main
```

Cada worktree precisa do seu próprio `npm ci` em `apps/backend` (node_modules não é
compartilhado) e da sua cópia de `.env`.

Antes de qualquer commit: confira que `git rev-parse --abbrev-ref HEAD` ainda é a sua branch.

### 2. Um banco de teste por agente

`test/env.setup.ts` já lê `DATABASE_URL_TEST`. Cada agente aponta para um banco próprio,
senão o `afterEach` de um apaga as fixtures do outro no meio da suíte:

```bash
# no .env do worktree do agente A
DATABASE_URL_TEST="postgresql://financi:financi@localhost:5439/financi_test_a?schema=public"
# no do agente B
DATABASE_URL_TEST="postgresql://financi:financi@localhost:5439/financi_test_b?schema=public"
```

Criar os bancos e aplicar as migrations neles uma vez, depois da onda 0:

```bash
docker exec -it financi-postgres psql -U financi -c "CREATE DATABASE financi_test_a;"
docker exec -it financi-postgres psql -U financi -c "CREATE DATABASE financi_test_b;"
```

```bash
cd apps/backend && DATABASE_URL="postgresql://financi:financi@localhost:5439/financi_test_a?schema=public" npx prisma migrate deploy
```

### 3. Ninguém roda `prisma migrate dev` na onda 1

Se você concluir que precisa de uma coluna nova, **pare e escale para o usuário**. Não crie
migration. O custo de um schema divergente entre as duas branches é maior que o de esperar.

### 4. Propriedade de arquivo

Conflito de merge nesta fase é falha de planejamento, não acaso. Cada arquivo tem um dono:

| Arquivo / diretório | Dono |
|---|---|
| `prisma/schema.prisma`, `prisma/migrations/**` | Onda 0 |
| `prisma/seed*.ts` | Onda 0 |
| `src/app.ts` | Onda 0 |
| `src/modules/categories/**` | Onda 0 |
| `src/modules/transactions/**` | Agente A |
| `src/modules/accounts/**` | Agente A |
| `src/modules/dashboard/**` | Agente B |
| `src/modules/budgets/**` | Agente B |
| `src/modules/goals/**` | Agente B |
| `test/e2e/setup.ts`, `test/e2e/helpers.ts` | Onda 0 |
| `openapi.yaml` | Onda 2 |
| `CLAUDE.md` | Onda 0 (domínio) e Onda 2 (endpoints) |

Precisa de um helper de teste novo? Crie em arquivo próprio dentro da sua área
(`test/e2e/helpers.accounts.ts`, por exemplo). Não edite `helpers.ts`.

### 5. Sonar é serial

Instância única em `localhost:9000`, mesma project key. Os dois agentes não rodam scan ao
mesmo tempo — o segundo sobrescreve o resultado do primeiro. Scan só no passo 4 do workflow
do `CLAUDE.md`, um de cada vez.

## Workflow por branch (do `CLAUDE.md`, vale para todas as ondas)

1. Branch criada a partir de `main` atualizada.
2. Commits atômicos — um commit por mudança lógica autocontida.
3. **Parar e apresentar ao usuário.** Não seguir sozinho.
4. Só após aprovação: `npm run lint && npm run build && npm run test:unit && npm run test:e2e`
   + scan do Sonar.
5. Passando os dois: merge.

Estilo de commit do repositório: conventional commit, assunto em português, **sem acento**,
minúsculo (`feat(backend): adiciona modelo de conta`). **Sem `Co-Authored-By`** — o histórico
fica só no nome do autor.

## Ordem de merge da onda 1

Agente A primeiro (mexe no núcleo de `transactions`), agente B rebasa em `main` depois e
resolve o que aparecer — que deve ser nada, pelas regras acima.

## Dependência cortada de propósito

O aporte de meta que gera transferência automática (`goals` chamando `createTransfer` de
`accounts`) seria a única dependência real entre A e B. **Foi adiada para a onda 2.** Na onda
1, `POST /goals/:id/contributions` aceita `transactionId` opcional já existente e nada mais.
Isso é deliberado: vale mais ter duas branches independentes do que economizar um commit
depois.

## Planos

- [`00-fundacao.md`](00-fundacao.md) — onda 0
- [`agente-a-contas-pagamento.md`](agente-a-contas-pagamento.md) — onda 1
- [`agente-b-previsao-orcamento-metas.md`](agente-b-previsao-orcamento-metas.md) — onda 1
- [`02-consolidacao.md`](02-consolidacao.md) — onda 2
