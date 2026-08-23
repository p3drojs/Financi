# Onda 2 — Consolidação

**Executor:** um agente, depois que `feat/fase2-contas` e
`feat/fase2-previsao-orcamento-metas` estiverem em `main`.

**Branch:** `feat/fase2-consolidacao`

Existe para juntar as pontas que foram cortadas de propósito para as duas branches da onda 1
não se encostarem.

---

## 1. Aporte de meta via transferência

A dependência real entre A e B. Agora os dois lados existem.

`POST /goals/:id/contributions` passa a aceitar `fromAccountId`:

- meta **com** `accountId` e requisição **com** `fromAccountId` → chama `createTransfer` do
  módulo de contas (`fromAccountId` → `goal.accountId`), grava a contribuição com
  `transactionId` da ponta de entrada, tudo dentro do mesmo `prisma.$transaction`;
- qualquer outra combinação → comportamento atual (só escrituração), sem erro;
- `fromAccountId` sem a meta ter conta → 400 explicando que a meta não tem conta vinculada.

`DELETE` da contribuição: se ela tem `transactionId`, apagar também a transferência inteira
(as duas pontas) — senão fica dinheiro parado numa conta-cofre sem nada explicando de onde
veio. Confirmar com o usuário se prefere manter o lançamento e só desvincular; é uma decisão
de produto, não técnica.

Teste: aporte de 500 com `fromAccountId` → saldo da origem cai 500, saldo da meta sobe 500,
`GET /dashboard/summary` não muda, `saved` da meta é 500.

## 2. `openapi.yaml`

Ficou de fora da onda 1 para não virar conflito de três vias. Documentar agora, de uma vez:
`/accounts`, `/accounts/transfers`, `/transactions/upcoming`, `/transactions/pay`,
`/dashboard/forecast`, `/budgets`, `/goals`, mais os campos novos em `Transaction`
(`accountId`, `transferGroupId`, `paid`, `paidAt`) e os parâmetros `accountId` nos endpoints
antigos.

Conferir subindo o backend e abrindo `/docs` — o Swagger UI é vitrine do portfólio, spec
quebrada aparece.

## 3. Reconciliação do brief de telas

O [`03-brief-telas.md`](03-brief-telas.md) foi escrito antes das ondas 1 e 2, a partir dos
planos — não do código. A seção 3 dele descreve rota, payload e campo de cada um dos seis
territórios novos, e é isso que o agente de design vai tomar como contrato. Se A ou B mudaram
alguma coisa pelo caminho, o brief manda desenhar tela para uma API que não existe.

Com o `openapi.yaml` recém-fechado o contrato real está aberto na sua frente — este é o
momento mais barato de conferir. Reler as seções 3.1 a 3.7 do brief contra os handlers e
corrigir o que divergir:

- nome, método e parâmetros de cada rota;
- os campos que o brief cita nominalmente, porque a tela foi desenhada em cima deles:
  `spent`/`committed` do orçamento, `lowestPoint`/`truncated` da previsão, `saved` da meta,
  `paid`/`paidAt` do lançamento, `transferGroupId` da transferência;
- o que o brief marcou como "contrato desenhado, não implementado" e agora existe — e,
  principalmente, o que continua não existindo mas o brief promete.

Aqui se corrige o brief, não o backend: divergência é documento desatualizado, não bug. A
exceção é divergência grande o bastante para mudar a tela — um território que não saiu, um
campo que sumiu do payload. Nesse caso pare e diga ao usuário, em vez de reescrever o desenho
sozinho.

## 4. `CLAUDE.md`

- **Implemented so far**: acrescentar Contas (CRUD, saldo, transferências), Orçamento, Metas,
  Previsão, e o pagamento em Transactions.
- **Known gaps**: remover o gap 2 (parcela sem flag de paga — resolvido). Acrescentar os que
  esta fase cria:
  - previsão limitada à janela de 12 meses de recorrência materializada (`truncated`);
  - cartão de crédito sem modelo de fatura — é conta com saldo negativo, fatura é
    transferência;
  - orçamento sem valor padrão recorrente, só cópia mês a mês;
  - usuários antigos não recebem conta padrão fora do backfill da migration.
- Atualizar a linha de fase no topo: backend da fase 2 completo, front pendente.

## 5. Varredura de invariante

Antes de fechar, `grep` por todo lugar que agrega valor e conferir se filtra transferência:

```bash
grep -rn "groupBy\|_sum" apps/backend/src/modules
```

Cada ocorrência que soma `amount` para mostrar receita/despesa ao usuário precisa de
`ledgerWhere`. As exceções legítimas são o saldo de conta e a previsão diária — que somam
movimento, não resultado.

## 6. Suíte completa e Sonar

Rodar tudo em `financi_test` (o banco original, não os `_a`/`_b`), incluindo
`npm run test:coverage -- --runInBand` e o scan do Sonar. Conferir o Quality Gate antes de
apresentar.

## 7. Deploy

Depois da aprovação: Render → Manual Deploy do último commit. A migration da onda 0 roda no
`prisma migrate deploy` do Start Command, contra o Neon com os dados reais do autor. O teste
de "migration em banco com dados" da onda 0 é o que garante que isso não quebra — se ele foi
pulado, pule o deploy também até rodá-lo.

---

## Depois disto

Backend da fase 2 fechado. O próximo plano é o do front, e ele não começa do zero: o
[`03-brief-telas.md`](03-brief-telas.md), já reconciliado no passo 3, é o ponto de entrada do
agente de design. Telas de contas, transferência, seleção de conta no formulário, bloco de
a-pagar e previsão na home, tela de orçamento, telas de metas. Nada disso entra nas branches
acima.
