# Fase 2 — Contas, Pagamento, Previsão, Orçamento e Metas

Desenho das features 4, 5, 3, 1, 2 (nesta ordem de implementação). Cada seção é uma branch
independente, com commits atômicos, seguindo o workflow do `CLAUDE.md`.

## Ordem e por quê

```
4. Contas  ──▶  5. Pago/não pago  ──▶  3. Previsão  ──▶  1. Orçamento  ──▶  2. Metas
   (schema)        (schema)             (leitura)         (schema)         (schema)
```

Contas vem primeiro porque altera `Transaction`, e todo agregado (dashboard, orçamento,
previsão) passa a ter que filtrar transferência. Fazer por último obrigaria a reescrever as
outras três. Pago/não pago vem em seguida porque previsão e orçamento dependem da distinção
entre *realizado* e *previsto*.

---

## 4. Contas / carteiras

### Modelo

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

  @@unique([userId, name])
  @@map("accounts")
}
```

`Transaction` ganha:

```prisma
  accountId       String
  transferGroupId String?

  account Account @relation(fields: [accountId], references: [id], onDelete: Restrict)

  @@index([userId, accountId, date])
  @@index([transferGroupId])
```

`Category` ganha `system Boolean @default(false)` para a categoria "Transferência".

### Migration em três passos

1. `accountId` entra **nullable**.
2. Data migration: para cada `User`, cria `Account { name: "Carteira", kind: CASH }` e as
   categorias de sistema "Transferência" (uma por tipo); faz
   `UPDATE transactions SET account_id = <conta padrão do usuário>`.
3. `ALTER COLUMN account_id SET NOT NULL`.

Registro (`auth.service`) passa a semear a conta padrão junto com as categorias default —
mesmo ponto onde `category.defaults.ts` é aplicado hoje.

### Transferência entre contas

**Decisão:** transferência é um **par de transações** ligadas por `transferGroupId`, não um
model separado. Motivo: a UX do app é um extrato cronológico único; um model paralelo
quebraria a paginação de `listTransactions`, que hoje é um `findMany` simples.

- `POST /accounts/transfers` `{ fromAccountId, toAccountId, amount, date, description? }`
- Cria dentro de uma transação de banco: um `EXPENSE` na origem e um `INCOME` no destino,
  mesmo `transferGroupId`, ambos na categoria de sistema "Transferência".
- `DELETE /accounts/transfers/:transferGroupId` apaga as duas pontas.
- Editar valor/data pelo `PATCH /transactions/:id` é **bloqueado** quando
  `transferGroupId != null` (400), para não dessincronizar as pontas.

**Invariante crítica:** todo agregado ignora transferência. Implementar um helper único em
`transaction.service.ts`:

```ts
export const ledgerWhere = { transferGroupId: null };
```

e usá-lo em `getSummary`, `getByCategory`, `getBalanceEvolution`, no orçamento e na previsão.
Vale um teste E2E dedicado: criar transferência → `GET /dashboard/summary` não muda. Esse é o
ponto mais fácil de errar do desenho inteiro.

### Saldo

`GET /accounts` devolve cada conta com saldo calculado:

```
saldo = initialBalance
      + Σ(INCOME  onde paid = true e date <= hoje)
      - Σ(EXPENSE onde paid = true e date <= hoje)
```

Transferência **entra** nesse cálculo (é o que move dinheiro entre contas); só sai dos
agregados de receita/despesa.

`GET /accounts/:id` = conta + saldo + últimas N transações.

### Cartão de crédito

Sem modelo de fatura no MVP. `CREDIT_CARD` é uma conta comum que vive com saldo negativo;
pagar a fatura é uma transferência da conta corrente para o cartão. Padrão conhecido, resolve
a maior parte do caso de uso e não abre o buraco de fechamento/vencimento de fatura.

### Endpoints

| Método | Rota | Nota |
|---|---|---|
| GET | `/accounts` | lista + saldo; `?includeArchived=true` |
| POST | `/accounts` | |
| GET | `/accounts/:id` | detalhe + extrato |
| PATCH | `/accounts/:id` | nome, cor, `initialBalance`, `archived` |
| DELETE | `/accounts/:id` | 409 se tiver transação; sugerir arquivar |
| POST | `/accounts/transfers` | |
| DELETE | `/accounts/transfers/:transferGroupId` | |

`listTransactions` ganha filtro `accountId`. Os três endpoints do dashboard ganham
`accountId` opcional.

### Mobile

- `app/contas/index.tsx` — lista com saldo, acessada por "Você".
- `app/conta/[id].tsx` — extrato da conta.
- Seletor de conta no formulário de nova transação (default: última usada, em storage local).
- Card de saldo por conta no topo do dashboard (carrossel horizontal) quando houver mais de
  uma conta; com uma conta só, mantém a tela atual sem poluir.
- `app/nova/transferencia.tsx`.

---

## 5. Pago / não pago

### Modelo

```prisma
  paid   Boolean   @default(true)
  paidAt DateTime?
```

Default `true` porque toda linha existente é fato consumado. Na **criação**, o serviço define
`paid = date <= hoje` (sobrescrevível pelo payload) — assim recorrência e parcelamento nascem
com as ocorrências futuras pendentes, que é o que destrava a previsão e o "contas a pagar".

### Endpoints

- `PATCH /transactions/:id` aceita `paid` no body; ao virar `true`, grava `paidAt = now()`,
  ao virar `false`, zera.
- `POST /transactions/pay` `{ ids: string[] }` — ação em lote ("pagar tudo que venceu").
- `GET /transactions/upcoming?days=7` — devolve `{ overdue: [...], upcoming: [...] }`:
  vencidas (`paid=false, date < hoje`) e a vencer (`paid=false, hoje <= date <= hoje+days`),
  ordenadas por data.

### Efeitos colaterais

- `summarizeInstallments` passa a contar `paid` de verdade, em vez de inferir pela data —
  fecha o gap 2 do `CLAUDE.md`.
- `GET /dashboard/summary` passa a devolver `balance` (realizado, só `paid`) **e**
  `committedBalance` (tudo no período). Os nomes atuais ficam como estão; o campo novo é
  aditivo, então o app não quebra.

### Mobile

- Swipe na lista de lançamentos → "marcar como paga".
- Lançamento não pago renderiza com opacidade reduzida e um ponto vazado; vencido, com o
  traço em `colors.brick`.
- Bloco "a pagar" na home, acima do gráfico, alimentado por `/transactions/upcoming`.

---

## 3. Previsão de fim de mês

Nenhum modelo novo. O futuro já está no banco (recorrências e parcelas pré-geradas).

### `GET /dashboard/forecast?until=YYYY-MM-DD&accountId=`

`until` default = último dia do mês corrente.

```jsonc
{
  "asOf": "2026-08-22",
  "until": "2026-08-31",
  "currentBalance": 2140.00,       // paid = true, date <= hoje
  "pendingIncome": 0,              // paid = false, hoje < date <= until
  "pendingExpense": 780.50,
  "overdue": { "count": 2, "total": 190.00 },
  "projectedBalance": 1359.50,
  "lowestPoint": { "date": "2026-08-27", "balance": 340.10 },
  "daily": [{ "date": "2026-08-22", "balance": 2140.00 }],
  "truncated": false
}
```

`lowestPoint` é o diferencial: não é "quanto sobra no fim", é "qual é o pior dia do caminho".
Calculado varrendo `daily`, que é um `reduce` cronológico sobre as transações do período.

**Guarda obrigatória:** `extendActiveRecurrences` só materializa
`RECURRENCE_BATCH_WINDOW_MONTHS` (12) meses à frente. Se `until` passar dessa janela, a
previsão silenciosamente perde ocorrências. Solução: limitar `until` ao fim da janela e
devolver `truncated: true`, que o app exibe como "previsão até <data>".

### Mobile

Complementa o card de saldo do dashboard: "hoje R$ 2.140 → fim do mês R$ 1.359", com uma
sparkline do `daily` e uma linha de alerta quando `lowestPoint.balance < 0`.

---

## 1. Orçamento por categoria

### Modelo

```prisma
model Budget {
  id         String   @id @default(uuid())
  userId     String
  categoryId String
  month      DateTime
  amount     Decimal  @db.Decimal(12, 2)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([userId, categoryId, month])
  @@map("budgets")
}
```

`month` é o **primeiro dia do mês** em UTC, não nulável. Descartei a ideia de "orçamento
padrão que vale todo mês" (`month = null`): no Postgres, `NULL` é distinto de `NULL` em
constraint única, então dois padrões da mesma categoria passariam pela unicidade. O
equivalente prático é `POST /budgets/copy`.

Validação: a categoria precisa ser do usuário, `type = EXPENSE` e `system = false`.

### Endpoints

| Método | Rota | Nota |
|---|---|---|
| GET | `/budgets?month=2026-08` | envelope com totais + itens |
| POST | `/budgets` | |
| PATCH | `/budgets/:id` | só `amount` |
| DELETE | `/budgets/:id` | |
| POST | `/budgets/copy` | `{ fromMonth, toMonth }`, ignora conflitos existentes |

Resposta do `GET`:

```jsonc
{
  "month": "2026-08",
  "totalBudgeted": 3200.00,
  "totalSpent": 2410.35,
  "items": [{
    "id": "…", "categoryId": "…", "categoryName": "Alimentação", "color": "#…",
    "amount": 900.00,
    "spent": 612.40,       // paid = true
    "committed": 780.90,   // tudo lançado no mês, pago ou não
    "remaining": 119.10,   // amount - committed
    "percent": 86.8,
    "status": "WARNING"    // OK < 80% | WARNING < 100% | OVER >= 100%
  }]
}
```

Duas colunas (`spent` e `committed`) porque orçamento é sobre compromisso: a parcela que ainda
não venceu já consumiu o mês. O app mostra `committed` na barra e `spent` como marca sólida
dentro dela.

Reaproveita quase inteiro o `groupBy` de `getByCategory` — o serviço novo faz uma query só,
com `ledgerWhere` aplicado.

### Mobile

- Bloco "orçamento" na home: barra agregada + as 3 categorias mais estouradas.
- `app/orcamento/index.tsx` — todas as categorias do mês, editar valor inline, botão "copiar
  do mês passado", navegação entre meses.
- Barra de consumo dentro de `app/categoria/[id].tsx`.
- Sem alerta push nesta fase (fica pra feature 9 da lista original).

---

## 2. Metas

### Modelo

```prisma
model Goal {
  id           String    @id @default(uuid())
  userId       String
  name         String
  targetAmount Decimal   @db.Decimal(12, 2)
  targetDate   DateTime?
  accountId    String?
  color        String?
  archived     Boolean   @default(false)
  achievedAt   DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user          User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  account       Account?           @relation(fields: [accountId], references: [id], onDelete: SetNull)
  contributions GoalContribution[]

  @@unique([userId, name])
  @@map("goals")
}

model GoalContribution {
  id            String   @id @default(uuid())
  goalId        String
  amount        Decimal  @db.Decimal(12, 2)
  date          DateTime
  transactionId String?  @unique
  createdAt     DateTime @default(now())

  goal        Goal         @relation(fields: [goalId], references: [id], onDelete: Cascade)
  transaction Transaction? @relation(fields: [transactionId], references: [id], onDelete: SetNull)

  @@index([goalId])
  @@map("goal_contributions")
}
```

### Dois modos de aporte

- **Meta com `accountId`** (conta-cofre, tipicamente `SAVINGS`): o aporte cria uma
  transferência de uma conta de origem para a conta da meta e guarda o `transactionId` da
  ponta de entrada. O dinheiro existe de verdade no app, sem contagem dupla.
- **Meta sem `accountId`**: aporte é só escrituração (`transactionId = null`). Útil pra
  acompanhar algo que mora fora do app.

`POST /goals/:id/contributions` `{ amount, date, fromAccountId? }` — com `fromAccountId`
presente **e** a meta tendo conta, faz a transferência; senão só registra.

### Derivados (calculados, não persistidos)

```
saved            = Σ contributions.amount
progress         = saved / targetAmount
remaining        = targetAmount - saved
requiredMonthly  = remaining / meses até targetDate   (null sem targetDate)
pace             = saved / meses desde a 1ª contribuição
projectedDate    = hoje + remaining / pace            (null sem pace)
onTrack          = projectedDate <= targetDate
```

`achievedAt` é gravado quando `saved >= targetAmount` na criação de um aporte.

### Endpoints

`GET /goals`, `POST /goals`, `GET /goals/:id`, `PATCH /goals/:id`, `DELETE /goals/:id`,
`POST /goals/:id/contributions`, `DELETE /goals/:id/contributions/:contributionId`.

### Mobile

- `app/metas/index.tsx` — cards com o traço de progresso (mesma linguagem visual do canvas:
  comprimento = proporção atingida).
- `app/meta/[id].tsx` — progresso, "precisa guardar R$ X/mês", histórico de aportes, botão de
  aporte.
- Entrada pela aba "Você"; card na home só quando existir meta ativa.

---

## Transversal

- `apps/backend/openapi.yaml` atualizado em cada branch (o `/docs` é vitrine do portfólio).
- Testes: unitário para os cálculos puros (saldo, previsão, `requiredMonthly`, status de
  orçamento) e E2E por endpoint novo. O teste E2E de transferência vs. dashboard é
  obrigatório.
- Stryker cobre os utilitários novos (previsão e metas são lógica de negócio pura).
- Nada de comentário explicativo no código, conforme `CLAUDE.md`.
