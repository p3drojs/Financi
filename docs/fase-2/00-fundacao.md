# Onda 0 — Fundação de schema

**Executor:** um agente, sozinho. Nenhum outro agente trabalha no repositório enquanto esta
branch não estiver mergeada.

**Branch:** `feat/fase2-fundacao`

**Objetivo:** deixar o banco, os stubs e os utilitários compartilhados prontos para que os
agentes A e B trabalhem em paralelo **sem tocar em nenhum arquivo comum**. Esta branch não
entrega nenhuma funcionalidade nova ao usuário — ela entrega ausência de conflito. Ao final,
a API deve se comportar exatamente como antes.

---

## 1. `prisma/schema.prisma`

Adicionar tudo de uma vez — inclusive o que só a onda 1 vai usar.

### Enum e modelo novo

```prisma
enum AccountKind {
  CHECKING
  SAVINGS
  CASH
  CREDIT_CARD
  INVESTMENT
}

model Account {
  id             String      @id @default(uuid())
  userId         String
  name           String
  kind           AccountKind
  color          String?
  initialBalance Decimal     @default(0) @db.Decimal(12, 2)
  archived       Boolean     @default(false)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]
  goals        Goal[]

  @@unique([userId, name])
  @@map("accounts")
}
```

### Alterações em modelos existentes

`Transaction`:

```prisma
  accountId       String
  transferGroupId String?
  paid            Boolean   @default(true)
  paidAt          DateTime?

  account            Account            @relation(fields: [accountId], references: [id], onDelete: Restrict)
  goalContribution   GoalContribution?

  @@index([userId, accountId, date])
  @@index([transferGroupId])
  @@index([userId, paid, date])
```

`Category`: `system Boolean @default(false)` + relação `budgets Budget[]`.

`User`: relações `accounts Account[]`, `budgets Budget[]`, `goals Goal[]`.

### Modelos da onda 1 (criados agora, usados depois)

`Budget`, `Goal`, `GoalContribution` exatamente como em
[`docs/design-fase-2.md`](../design-fase-2.md). Copiar de lá, não reinventar.

---

## 2. Migration em três passos

`accountId` é `NOT NULL`, mas existem linhas em produção. A migration gerada pelo Prisma não
sabe fazer o backfill sozinha — precisa ser editada à mão:

```bash
cd apps/backend
npx prisma migrate dev --create-only --name fase2_contas_orcamento_metas
```

Editar o SQL gerado para que a ordem seja:

1. `CREATE TABLE accounts / budgets / goals / goal_contributions`, `CREATE TYPE AccountKind`.
2. `ALTER TABLE transactions ADD COLUMN account_id TEXT` — **sem** `NOT NULL`.
3. `ALTER TABLE categories ADD COLUMN system BOOLEAN NOT NULL DEFAULT false`.
4. Backfill, em SQL puro dentro da própria migration:
   - inserir uma `accounts` por usuário (`name = 'Carteira'`, `kind = 'CASH'`,
     `initial_balance = 0`);
   - inserir as duas categorias de sistema por usuário (`'Transferência'` com
     `type = 'INCOME'` e `type = 'EXPENSE'`, `system = true`) — respeitando a unicidade
     `userId+name+type`, com `ON CONFLICT DO NOTHING`;
   - `UPDATE transactions t SET account_id = a.id FROM accounts a WHERE a.user_id = t.user_id`.
5. `ALTER TABLE transactions ALTER COLUMN account_id SET NOT NULL` + a FK e os índices.

Aplicar e conferir:

```bash
npx prisma migrate dev
DATABASE_URL="postgresql://financi:financi@localhost:5439/financi_test?schema=public" npx prisma migrate deploy
```

**Verificação obrigatória, em dois cenários:**

- banco vazio → migration aplica limpa;
- banco com dados (rodar `npm run db:seed` antes de migrar, num banco descartável) →
  nenhuma transação fica com `account_id` nulo e a migration não aborta.

Se falhar no segundo, o deploy no Render quebra em produção com o banco do autor dentro. Não
pule.

---

## 3. Semente da conta padrão e das categorias de sistema

- Criar `src/modules/accounts/account.defaults.ts` com `DEFAULT_ACCOUNT` (`Carteira`, `CASH`)
  no mesmo formato de `category.defaults.ts`.
- Criar `src/modules/accounts/account.service.ts` contendo **apenas**
  `createDefaultAccount(userId)` por enquanto. O agente A preenche o resto do arquivo depois.
- Em `category.defaults.ts` / `category.service.ts`: acrescentar as duas categorias
  `Transferência` (`system: true`) em `createDefaultCategories`.
- `src/modules/auth/auth.service.ts`: chamar `createDefaultAccount` no mesmo ponto onde
  `createDefaultCategories` já é chamado no registro.
- `prisma/seed.shared.ts`: `resetSeedUser` cria a conta padrão; `resetExistingUser` limpa
  `goalContribution`, `goal`, `budget` e `account` do usuário, na ordem correta de FK.

**Esconder as categorias de sistema:** `GET /categories` passa a filtrar `system: false` por
padrão, com `?includeSystem=true` para não perder acesso. Sem isso, "Transferência" aparece
no grid de categorias do app na hora de lançar uma despesa.

---

## 4. Stubs de rota (é isto que evita conflito em `app.ts`)

Criar três routers vazios, já registrados:

```ts
// src/modules/accounts/account.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';

export const accountRouter = Router();

accountRouter.use(authMiddleware);
```

Idem `src/modules/budgets/budget.routes.ts` (`budgetRouter`) e
`src/modules/goals/goal.routes.ts` (`goalRouter`).

Em `src/app.ts`, registrar os três junto aos demais:

```ts
  app.use('/accounts', accountRouter);
  app.use('/budgets', budgetRouter);
  app.use('/goals', goalRouter);
```

Depois disso, **nenhum agente da onda 1 abre `app.ts`**.

---

## 5. `ledgerWhere` e aplicação nos agregados

Criar `src/modules/transactions/ledger.ts`:

```ts
export const ledgerWhere = { transferGroupId: null } as const;
```

Arquivo próprio, e não um export de `transaction.service.ts`, porque o agente B precisa
importá-lo sem depender de um arquivo que o agente A está reescrevendo.

Aplicar já em:

- `dashboard.service.ts` → `getSummary`, `getByCategory`, `getBalanceEvolution`;
- `transaction.service.ts` → nada por enquanto (a listagem **mostra** transferência de
  propósito; só os agregados a ignoram).

Como transferência ainda não existe nesta branch, o filtro é inócuo hoje — e é exatamente por
isso que ele entra agora, sem disputa de arquivo depois.

---

## 6. Limpeza de teste

`test/e2e/setup.ts` — o `afterEach` precisa das tabelas novas, na ordem de FK:

```
transactionTag → goalContribution → transaction → recurrence → goal → budget
              → category → tag → account → user
```

`test/e2e/helpers.ts` — acrescentar `createAccount(app, token, overrides)` e fazer
`registerUser` devolver também a conta padrão (`accountId`), já que quase todo teste da onda 1
vai precisar dela. Os agentes da onda 1 **não editam este arquivo**, então ele precisa sair
completo daqui.

---

## 7. `CLAUDE.md`

Atualizar só a seção **Domain model**: `Account` (com transferência como par de transações
ligado por `transferGroupId`), `paid`/`paidAt`, `Budget`, `Goal`/`GoalContribution`, e a nota
de que categoria de sistema existe e é escondida da listagem. A seção "Implemented so far"
fica para a onda 2 — nenhum endpoint novo existe ainda.

---

## Commits sugeridos

```
feat(backend): adiciona modelos de conta, orcamento e meta
feat(backend): vincula transacao a conta e marca pagamento
feat(backend): semeia conta padrao e categoria de transferencia no cadastro
feat(backend): esconde categorias de sistema da listagem
refactor(backend): isola filtro de extrato usado pelos agregados
chore(backend): registra rotas vazias de conta, orcamento e meta
test(backend): limpa as novas tabelas entre os testes e2e
docs: atualiza o modelo de dominio no claude.md
```

---

## Critério de aceite

- `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:e2e` verdes.
- **Nenhum teste existente alterado por mudança de comportamento.** Se um teste de dashboard
  precisou mudar de número esperado, algo está errado — esta branch não muda resultado.
- Migration aplica em banco vazio e em banco com dados.
- `GET /categories` não devolve "Transferência".
- Usuário recém-registrado tem exatamente uma conta.
- `src/app.ts`, `test/e2e/setup.ts` e `test/e2e/helpers.ts` não precisarão ser tocados na
  onda 1. Se sobrou algo neles pra fazer, faça agora.

Ao terminar: parar e apresentar ao usuário (passo 3 do workflow). Só depois testes + Sonar +
merge, e só então liberar A e B.
