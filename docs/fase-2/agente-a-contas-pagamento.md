# Agente A — Contas, transferências e pagamento

**Pré-requisito:** onda 0 mergeada em `main`. Se `prisma/schema.prisma` não tem `model
Account`, pare — você começou cedo.

**Worktree:** `../financi-agente-a` · **Branch:** `feat/fase2-contas`

**Sua área (não escreva fora dela):**
`src/modules/accounts/**`, `src/modules/transactions/**`, `test/e2e/accounts.e2e.test.ts`,
`test/e2e/transactions-*.e2e.test.ts`, `test/unit/modules/**` dos seus arquivos.

**Proibido:** `prisma/**`, `src/app.ts`, `src/modules/dashboard/**`, `openapi.yaml`,
`CLAUDE.md`, `test/e2e/setup.ts`, `test/e2e/helpers.ts`. Precisa de coluna nova? Escale, não
crie migration.

---

## Entrega 1 — Módulo de contas

Arquivos: `account.schema.ts`, `account.controller.ts`, `account.service.ts` (já existe com
`createDefaultAccount` — preservar), `account.routes.ts` (já existe como stub — preencher).

| Método | Rota | Comportamento |
|---|---|---|
| GET | `/accounts` | lista + saldo. `?includeArchived=true` (default false) |
| POST | `/accounts` | `{ name, kind, color?, initialBalance? }` |
| GET | `/accounts/:id` | conta + saldo + últimas 20 transações |
| PATCH | `/accounts/:id` | `name`, `color`, `initialBalance`, `archived` |
| DELETE | `/accounts/:id` | 409 se tiver transação, com mensagem sugerindo arquivar |

### Saldo

```
saldo = initialBalance + Σ(INCOME onde paid) - Σ(EXPENSE onde paid), tudo com date <= hoje
```

Transferência **entra** no saldo — é o que move dinheiro entre contas. Não aplique
`ledgerWhere` aqui; ele serve só para agregados de receita/despesa.

Uma query só para a lista inteira, sem N+1:

```ts
prisma.transaction.groupBy({
  by: ['accountId', 'type'],
  where: { userId, paid: true, date: { lte: now } },
  _sum: { amount: true },
});
```

e combine com `findMany` das contas em memória. Conta sem transação precisa aparecer com
`saldo = initialBalance`, então itere pelas contas, não pelo resultado do `groupBy`.

Use `Prisma.Decimal` do começo ao fim. Não converta para `number` em lugar nenhum do cálculo —
o resto do backend já segue isso.

### Erros

`NotFoundError` para conta de outro usuário (nunca 403 — não vaze existência).
`ConflictError`/409 no delete com transação. Nome duplicado → 409, pela unicidade
`userId+name`.

---

## Entrega 2 — Transferências

| Método | Rota | |
|---|---|---|
| POST | `/accounts/transfers` | `{ fromAccountId, toAccountId, amount, date, description? }` |
| DELETE | `/accounts/transfers/:transferGroupId` | apaga as duas pontas |

Implementação:

- `randomUUID()` para o `transferGroupId`, mesmo padrão de `installmentGroupId`.
- Dentro de `prisma.$transaction`: um `EXPENSE` na origem e um `INCOME` no destino, mesmo
  valor, mesma data, mesmo `transferGroupId`, `paid` seguindo a regra da entrega 3.
- Categoria: as de sistema `Transferência` do usuário (`system: true`), uma por tipo. Busque
  por `userId + name + type`; se não existir (usuário antigo que escapou do backfill), crie na
  hora.
- Validações: contas diferentes (400 se iguais), ambas do usuário, `amount > 0`, nenhuma
  arquivada.

### Blindagem

- `PATCH /transactions/:id` → 400 quando `transferGroupId != null`. Mensagem explicando que a
  transferência se edita apagando e refazendo. Sem isso, dá pra editar uma ponta e deixar as
  contas dessincronizadas para sempre.
- `DELETE /transactions/:id` → 400 na mesma condição; use a rota de transferência.
- `POST /transactions` (e recurring/installments) → 400 se a `categoryId` for `system: true`.

### Teste que não pode faltar

```
criar transferência de 100 entre duas contas
  → GET /dashboard/summary devolve exatamente os mesmos totalIncome/totalExpense/balance de antes
  → GET /accounts mostra origem -100 e destino +100
```

É a invariante mais frágil do desenho inteiro. Escreva esse teste antes do código.

---

## Entrega 3 — Pago / não pago

### Regra de criação

Em `createTransaction`, `createRecurringTransaction` e `createInstallmentTransaction`:

```
paid = input.paid ?? (date <= hoje)
paidAt = paid ? now() : null
```

Ou seja, ocorrência futura de recorrência e parcela que ainda não venceu nascem pendentes. É
disso que a previsão e o "a pagar" do agente B dependem — mas note que ele testa com `paid`
explícito, então vocês não se bloqueiam.

Cuidado com fuso: compare pelo **fim do dia local** da data da transação, não pelo instante.
Uma transação lançada hoje às 23h não pode nascer pendente. O resto do backend usa `Date` sem
biblioteca de fuso; siga o mesmo, mas normalize para fim do dia.

### Endpoints

- `PATCH /transactions/:id` aceita `paid` no body. `true` → `paidAt = now()`; `false` →
  `paidAt = null`. Continua valendo a regra do `CLAUDE.md`: afeta só aquela ocorrência.
- `POST /transactions/pay` `{ ids: string[] }` → marca em lote, devolve `{ updated: n }`.
  Ignora id de outro usuário em silêncio (não vaze existência). Máx. 200 ids no Zod.
- `GET /transactions/upcoming?days=7` (default 7, máx 90) →

```jsonc
{
  "overdue":  { "total": 190.00, "items": [] },   // paid=false, date < hoje
  "upcoming": { "total": 780.50, "items": [] }    // paid=false, hoje <= date <= hoje+days
}
```

Ordenado por data ascendente, com `include: transactionInclude`.

### Ordem das rotas

`upcoming` tem que ser registrada **antes** de `/:id`, senão o Express casa `:id = "upcoming"`.
O arquivo já faz isso com `/recurring`; siga o mesmo lugar. Um teste que faz
`GET /transactions/upcoming` e espera 200 pega essa regressão.

### `summarizeInstallments`

Passa a contar `paid === true` em vez de inferir pela data — fecha o gap 2 do `CLAUDE.md`. O
contrato de resposta de `GET /transactions/installments/:groupId` não muda de formato; muda a
origem do número. Ajuste os testes unitários de `installment.util.test.ts`.

---

## Entrega 4 — Filtro por conta

`listTransactions` ganha `accountId` opcional no `ListTransactionsQuery` e no `where`. Só
isso — os filtros de dashboard por conta são do agente B.

---

## Testes

**Unitários** — o cálculo de saldo e a regra `paid = date <= hoje` extraídos como funções
puras em `account.util.ts` / `transaction.util.ts`, testados sem banco. O Stryker cobre
lógica de negócio; funções puras é o que dá mutação decente.

**E2E** (`test/e2e/accounts.e2e.test.ts`, `transactions-pagamento.e2e.test.ts`):

- conta criada com nome repetido → 409;
- delete de conta com transação → 409; arquivar funciona;
- saldo confere depois de receita, despesa e transferência;
- transferência não altera `GET /dashboard/summary`;
- `PATCH` em ponta de transferência → 400;
- parcelamento criado com 3 parcelas futuras nasce com `paidCount = 0`; marcar a primeira como
  paga leva a `paidCount = 1`;
- `GET /transactions/upcoming` separa vencida de a vencer;
- `POST /transactions/pay` com id de outro usuário não altera nada e não vaza 404.

Helpers novos vão em `test/e2e/helpers.accounts.ts`, arquivo seu. Não toque em `helpers.ts`.

---

## Commits sugeridos

```
feat(backend): expoe crud de contas com saldo calculado
feat(backend): cria transferencia entre contas como par de lancamentos
feat(backend): bloqueia edicao direta de lancamento de transferencia
feat(backend): marca lancamento como pago e expoe contas a pagar
feat(backend): conta parcela paga pelo flag em vez da data
feat(backend): filtra lancamentos por conta
test(backend): cobre saldo, transferencia e pagamento
```

## Critério de aceite

- Lint, build, unit e e2e verdes com `DATABASE_URL_TEST` apontando para `financi_test_a`.
- Nenhum arquivo fora da sua área no `git diff --name-only main`. Confira antes de apresentar.
- Endpoints antigos com o mesmo contrato de resposta de antes (campos novos podem ser
  acrescentados, nenhum removido ou renomeado — o app em produção consome isso).
- Parar e apresentar ao usuário. Sonar só depois, e só quando o agente B não estiver rodando o
  dele.
