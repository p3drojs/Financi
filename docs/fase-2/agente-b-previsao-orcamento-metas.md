# Agente B — Previsão, orçamento e metas

**Pré-requisito:** onda 0 mergeada em `main`. Se `prisma/schema.prisma` não tem `model
Budget`, pare — você começou cedo.

**Worktree:** `../financi-agente-b` · **Branch:** `feat/fase2-previsao-orcamento-metas`

**Sua área:** `src/modules/dashboard/**`, `src/modules/budgets/**`, `src/modules/goals/**`,
`test/e2e/{forecast,budgets,goals}.e2e.test.ts`, testes unitários dos seus utilitários.

**Proibido:** `prisma/**`, `src/app.ts`, `src/modules/transactions/**`,
`src/modules/accounts/**`, `openapi.yaml`, `CLAUDE.md`, `test/e2e/setup.ts`,
`test/e2e/helpers.ts`. Precisa de coluna nova? Escale, não crie migration.

**Você importa, mas não edita:** `extendActiveRecurrences` e `transactionInclude` de
`transaction.service.ts`, `RECURRENCE_BATCH_WINDOW_MONTHS` e `addMonths` de
`recurrence.util.ts`, `ledgerWhere` de `ledger.ts`.

**Independência do agente A:** ele está implementando a regra "transação futura nasce com
`paid = false`". Você não pode depender disso para testar. Nos seus E2E, crie os dados com
`paid` **explícito** no payload ou direto via Prisma. Assim sua suíte passa hoje e continua
passando depois do merge dele.

---

## Entrega 1 — Previsão

Arquivo novo `src/modules/dashboard/forecast.service.ts`. Não misture em
`dashboard.service.ts`.

### `GET /dashboard/forecast?until=YYYY-MM-DD&accountId=`

`until` default: último dia do mês corrente.

```jsonc
{
  "asOf": "2026-08-22",
  "until": "2026-08-31",
  "currentBalance": 2140.00,
  "pendingIncome": 0,
  "pendingExpense": 780.50,
  "overdue": { "count": 2, "total": 190.00 },
  "projectedBalance": 1359.50,
  "lowestPoint": { "date": "2026-08-27", "balance": 340.10 },
  "daily": [{ "date": "2026-08-22", "balance": 2140.00 }],
  "truncated": false
}
```

Definições, sem ambiguidade:

- `currentBalance` — `paid = true` e `date <= hoje`. Sem conta filtrada, é a soma de todas as
  contas **mais** a soma de `initialBalance` de todas elas. Com `accountId`, só aquela conta e
  o `initialBalance` dela.
- `pendingIncome` / `pendingExpense` — `paid = false`, `hoje < date <= until`.
- `overdue` — `paid = false`, `date < hoje`. Não entra em `projectedBalance`: é dívida do
  passado, e somar com o futuro esconde o problema em vez de mostrar.
- `projectedBalance = currentBalance + pendingIncome - pendingExpense`.
- `daily` — um ponto por dia de hoje até `until`, saldo acumulado. `lowestPoint` é o mínimo
  desse array (empate: a data mais cedo).

`ledgerWhere` em tudo — transferência não é receita nem despesa, e sem o filtro ela apareceria
duas vezes com sinais opostos, o que dá o número certo por acaso e o `daily` errado no dia.

Chame `extendActiveRecurrences(userId)` antes de ler, como os outros endpoints do dashboard.

### O limite de 12 meses

`extendActiveRecurrences` só materializa `RECURRENCE_BATCH_WINDOW_MONTHS` meses à frente. Se
`until` passar disso, a previsão perde ocorrências **sem erro nenhum** — o pior tipo de bug
num app de finanças. Trate assim:

```
limite = addMonths(hoje, RECURRENCE_BATCH_WINDOW_MONTHS)
se until > limite: until = limite, truncated = true
```

Teste dedicado: pedir previsão para daqui a 24 meses devolve `truncated: true` e `until`
recuado.

### Filtro por conta nos endpoints existentes

`getSummary`, `getByCategory` e `getBalanceEvolution` ganham `accountId` opcional no schema e
no `where`. Mudança pequena, é sua porque o módulo inteiro é seu.

---

## Entrega 2 — Orçamento

`src/modules/budgets/` — schema, controller, service, routes (stub já existe).

| Método | Rota | |
|---|---|---|
| GET | `/budgets?month=2026-08` | envelope com totais |
| POST | `/budgets` | `{ categoryId, month, amount }` |
| PATCH | `/budgets/:id` | só `amount` |
| DELETE | `/budgets/:id` | |
| POST | `/budgets/copy` | `{ fromMonth, toMonth }` |

### `month`

Entra e sai da API como string `"YYYY-MM"`; persiste como `DateTime` no **primeiro dia do mês
em UTC**. Faça isso num transform do Zod (`monthSchema`) usado por todas as rotas — se cada
handler converter do seu jeito, uma hora um vira 31/07T21:00 e o orçamento cai no mês errado.
Vale teste unitário só disso.

### Validações

- categoria do usuário, `type = EXPENSE`, `system = false` → senão 400;
- `amount > 0`;
- duplicado (`userId + categoryId + month`) → 409;
- `POST /budgets/copy` pula os que já existem no destino em vez de falhar; devolve
  `{ created: n, skipped: n }`.

### Resposta do `GET`

```jsonc
{
  "month": "2026-08",
  "totalBudgeted": 3200.00,
  "totalSpent": 2410.35,
  "totalCommitted": 2890.00,
  "items": [{
    "id": "…", "categoryId": "…", "categoryName": "Alimentação", "color": "#…",
    "amount": 900.00,
    "spent": 612.40,
    "committed": 780.90,
    "remaining": 119.10,
    "percent": 86.8,
    "status": "WARNING"
  }]
}
```

- `spent` = `paid = true` no mês. `committed` = tudo lançado no mês, pago ou não.
- `remaining = amount - committed` (pode ser negativo).
- `status`: `OK` < 80% · `WARNING` < 100% · `OVER` >= 100%, calculado sobre `committed`.
- Uma query só: `groupBy(['categoryId'])` com `ledgerWhere` no intervalo do mês, e um segundo
  `groupBy` com `paid: true` — ou um `groupBy(['categoryId','paid'])` e soma em memória.
  Prefira o segundo.
- Categoria com orçamento e sem gasto aparece com zeros. Gasto em categoria **sem** orçamento
  não aparece em `items` (é a tela de orçamento, não a de gastos), mas conta em
  `totalSpent`/`totalCommitted`? **Não** — os totais são sobre as categorias orçadas, senão o
  "totalBudgeted vs totalSpent" da home fica incomparável. Deixe explícito no teste.

Extraia `budgetStatus(amount, committed)` para `budget.util.ts` — função pura, é o que o
Stryker vai morder.

---

## Entrega 3 — Metas

`src/modules/goals/`.

`GET /goals` · `POST /goals` · `GET /goals/:id` · `PATCH /goals/:id` · `DELETE /goals/:id` ·
`POST /goals/:id/contributions` · `DELETE /goals/:id/contributions/:contributionId`

### Aporte, versão da onda 1

```
POST /goals/:id/contributions  { amount, date, transactionId? }
```

Registra a contribuição. Se vier `transactionId`, valida que é do usuário e ainda não está
ligado a outra contribuição (`@unique`) — 409 se estiver.

**Não implemente a criação automática de transferência.** Ela depende do
`createTransfer` do agente A e ficou para a onda 2, de propósito. Não invente um atalho
gravando duas transações à mão: duplicaria a lógica dele e daria divergência no merge.

### Derivados (calculados na leitura, nunca persistidos)

```
saved            = Σ contributions.amount
progress         = saved / targetAmount            (limitado a 1 na exibição, cru na API)
remaining        = max(targetAmount - saved, 0)
requiredMonthly  = remaining / meses até targetDate    (null se sem targetDate ou já vencida)
pace             = saved / meses desde a 1ª contribuição   (null com menos de 1 mês)
projectedDate    = hoje + remaining / pace             (null sem pace)
onTrack          = targetDate ? projectedDate <= targetDate : null
```

Divisão por zero em três lugares. Todos devolvem `null`, não `Infinity` — `Infinity` vira
`null` no `JSON.stringify` de forma silenciosa e você descobre no app.

`achievedAt` é gravado quando um aporte leva `saved >= targetAmount`; apagar aportes até
ficar abaixo do alvo volta para `null`.

Tudo isso em `goal.util.ts`, puro, testado sem banco.

### Validações

- `targetAmount > 0`; `targetDate` no futuro na criação;
- nome único por usuário → 409;
- `accountId`, se vier, precisa ser do usuário (guarde o vínculo mesmo sem usar ainda, é o
  que a onda 2 vai consumir);
- `DELETE /goals/:id` remove as contribuições em cascata, mas **não** apaga transação
  vinculada — o dinheiro no extrato continua existindo.

---

## Testes

Helpers seus em `test/e2e/helpers.budgets.ts` e `helpers.goals.ts`. `helpers.ts` é intocável.

Cobertura mínima:

- previsão com recorrência futura pendente: `projectedBalance` bate na mão;
- previsão com `until` a 24 meses → `truncated: true`;
- `lowestPoint` acerta o dia do vale, não o último dia;
- transferência (criada direto via Prisma nesta branch, já que o endpoint é do agente A) não
  mexe em `projectedBalance` nem no `daily`;
- orçamento duplicado → 409; categoria `INCOME` → 400; categoria de sistema → 400;
- `status` vira `OVER` por conta de parcela **não paga** dentro do mês;
- `copy` pula existentes;
- meta sem `targetDate` devolve `requiredMonthly: null` em vez de estourar;
- aporte que atinge o alvo grava `achievedAt`; apagar o aporte limpa.

---

## Commits sugeridos

```
feat(backend): projeta saldo ate o fim do mes com ponto mais baixo
feat(backend): limita previsao a janela de recorrencia ja materializada
feat(backend): filtra dashboard por conta
feat(backend): expoe orcamento mensal por categoria
feat(backend): copia orcamento do mes anterior
feat(backend): expoe metas com progresso e aporte
test(backend): cobre previsao, orcamento e metas
```

## Critério de aceite

- Lint, build, unit e e2e verdes com `DATABASE_URL_TEST` apontando para `financi_test_b`.
- `git diff --name-only main` não mostra nada fora da sua área.
- Contratos antigos do dashboard preservados: `accountId` é opcional e a resposta sem ele é
  idêntica à de hoje. O app em produção chama esses três endpoints.
- Parar e apresentar ao usuário. Rebase em `main` depois do merge do agente A, rodar a suíte
  de novo, e só então Sonar (nunca simultâneo com ele) e merge.
