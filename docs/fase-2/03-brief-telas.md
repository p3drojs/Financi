# Fase 2 — Brief de redesenho das telas

**Para quem:** o agente que vai redesenhar as telas e o fluxo do app depois que o backend da
fase 2 estiver pronto.

**O que este documento é:** o contrato entre o backend novo e a interface. Ele diz o que
passou a existir, o que cada coisa significa e o que não pode ser inventado. Ele **não** diz
como as telas devem ficar — isso é teu trabalho.

**O que este documento não autoriza:** escrever código em `apps/mobile/` ainda. Esta fase é
de desenho. A implementação em React Native vem depois, em plano próprio, e só quando o
desenho estiver aprovado pelo autor.

---

## 1. Leia isto antes, nesta ordem

| Arquivo | Por quê |
|---|---|
| `apps/mobile/src/theme/tokens.ts` | **fonte da verdade da linguagem visual.** Não é o `CLAUDE.md` |
| `design/canvas.json` + os 6 `.dc.html` | artboards 390x844 já desenhados (gitignored, local) |
| `docs/design-fase-2.md` | por que cada feature foi modelada assim |
| `docs/fase-2/agente-a-contas-pagamento.md` | contrato exato de contas, transferência e pagamento |
| `docs/fase-2/agente-b-previsao-orcamento-metas.md` | contrato exato de previsão, orçamento e metas |
| `apps/backend/openapi.yaml` | depois da onda 2, é a referência final |

**Aviso sobre o `CLAUDE.md`:** a seção de design dele descreve o tema como "gradiente
preto→verde-escuro". Isso está desatualizado. O app real usa um tema de papel quente
(`#1B1815`), tipografia editorial e acentos sage/brick. Onde os dois discordarem, **o
`tokens.ts` ganha**.

---

## 2. O que o app é hoje

Quatro abas mais um FAB central:

```
o mês  ·  lançamentos  ·  [ + ]  ·  repetições  ·  você
```

| Rota | Tela |
|---|---|
| `app/(tabs)/index.tsx` | "o mês" — entrou / saiu / sobrou, traços por categoria, linha de seis meses |
| `app/(tabs)/lancamentos.tsx` | extrato agrupado por data, com filtros |
| `app/(tabs)/repeticoes.tsx` | recorrências ativas |
| `app/(tabs)/voce.tsx` | identidade, atalhos para categorias e etiquetas, sair |
| `app/nova/index.tsx`, `app/nova/parcelada.tsx` | criar lançamento / parcelamento |
| `app/transacao/[id].tsx`, `app/recorrencia/[id].tsx`, `app/parcelamento/[groupId].tsx` | detalhes |
| `app/categorias.tsx`, `app/categoria/[id].tsx`, `app/etiquetas.tsx` | listas auxiliares |
| `app/entrar.tsx` | login e cadastro |

### A voz do produto — preserve

O app fala em **minúsculas, em português, em prosa**. Os títulos são serif itálico
(`Newsreader`), o corpo é sans (`Karla`). As seções não se chamam "Receitas" e "Despesas", se
chamam **"entrou"**, **"saiu"**, **"sobrou"**, **"para onde foi"**, **"seis meses"**. Até os
estados de carregamento são frases: *"somando o mês"*, *"separando por categoria"*,
*"desenhando a linha"*. O vazio também: *"nenhuma saída neste mês"*.

Isso é o traço mais forte do produto. Nomes novos de tela e de seção precisam nascer nessa
mesma voz. **"Dashboard de orçamento" está errado. "quanto ainda dá" está certo.**

### Cor tem significado fixo

- entrada → `colors.sage`, com `+`
- saída → `colors.brick`, com `-`
- campo de valor editável → sem sinal e sem cor

Vale nas listas e no total "saiu". Foi uma correção que o autor pediu depois de testar o APK;
não reabra essa decisão.

---

## 3. O que mudou no backend

### Estado real, hoje

A **onda 0 já está em produção**. Ela criou as tabelas e a conta padrão, mas **não expôs
nenhum endpoint novo** — do ponto de vista do app, nada mudou ainda. Duas mudanças silenciosas
que já valem:

- todo usuário tem uma conta chamada **"Carteira"**, e todo lançamento pertence a uma conta;
- existe uma categoria de sistema **"Transferência"** que o `GET /categories` **esconde**. Se
  algum dia você precisar dela, é `?includeSystem=true`. Ela nunca aparece no grid de escolher
  categoria.

Tudo abaixo é **contrato desenhado, ainda não implementado**. Você não consegue chamar esses
endpoints hoje — desenhe contra o contrato, não contra o servidor.

### 3.1 Contas / carteiras

Uma conta é onde o dinheiro está: conta corrente, poupança, dinheiro vivo, cartão de crédito,
investimento (`AccountKind`). Tem nome, cor opcional, saldo inicial e pode ser arquivada.

```
GET    /accounts                 lista + saldo calculado; ?includeArchived=true
POST   /accounts                 { name, kind, color?, initialBalance? }
GET    /accounts/:id             conta + saldo + últimas 20 transações
PATCH  /accounts/:id             name, color, initialBalance, archived
DELETE /accounts/:id             409 se tiver lançamento — o caminho é arquivar
```

O saldo é `initialBalance + entradas pagas - saídas pagas`, contando só o que já venceu.

**Cartão de crédito não tem fatura.** É uma conta comum que vive negativa. Pagar a fatura é
uma transferência da conta corrente para o cartão. Não desenhe tela de fechamento, vencimento
ou "fatura atual" — não existe nada disso no banco.

### 3.2 Transferência

```
POST   /accounts/transfers                    { fromAccountId, toAccountId, amount, date, description? }
DELETE /accounts/transfers/:transferGroupId
```

**Transferência não é um lançamento. São dois** — uma saída na origem e uma entrada no
destino, irmãs, ligadas por um `transferGroupId`, ambas na categoria de sistema
"Transferência".

Consequências que a interface precisa respeitar:

- ela **aparece** no extrato (as duas pontas), porque o extrato é cronológico e o dinheiro se
  moveu de verdade;
- ela **não** conta em "entrou", "saiu", "para onde foi", orçamento nem previsão — senão o mês
  do usuário fica com receita e despesa fantasma;
- ela **conta** no saldo das contas;
- editar uma ponta é **bloqueado** (400). Para mudar valor ou data, apaga e refaz. A mensagem
  de erro precisa explicar isso, e o ideal é a interface nem oferecer o botão de editar.

Desenhar as duas pontas como se fossem uma coisa só é o ponto mais fácil de errar do fluxo
inteiro. Vale decidir explicitamente como o extrato mostra isso: duas linhas soltas confundem.

### 3.3 Pago / não pago

Todo lançamento tem `paid` e `paidAt`. Na criação, `paid = a data já chegou` — então
**ocorrência futura de recorrência e parcela que ainda não venceu nascem pendentes**.

```
PATCH  /transactions/:id            aceita paid no corpo
POST   /transactions/pay            { ids: [] } — pagar em lote
GET    /transactions/upcoming?days=7
       → { overdue: { total, items }, upcoming: { total, items } }
```

Isso divide o extrato em dois mundos que hoje não existem: **o que aconteceu** e **o que está
marcado para acontecer**. O desenho anterior já previa: pendente com opacidade menor e um
ponto vazado; vencido com o traço em `colors.brick`. Confirme se isso ainda serve.

`GET /dashboard/summary` ganha `committedBalance` (tudo do período) ao lado do `balance`
(só o pago). Os campos atuais não mudam de nome.

> **Pegadinha com os dados reais do autor.** O que já existia no banco antes da fase 2 ficou
> todo marcado como pago, incluindo ocorrências futuras — o autor dispensou a correção porque
> a base é pequena. Se ele testar e disser que "a pagar" está vazio, **não é bug do teu
> desenho**: é histórico anterior a 22/08/2026.

### 3.4 Previsão de fim de mês

```
GET /dashboard/forecast?until=YYYY-MM-DD&accountId=
```

```jsonc
{
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

**O `lowestPoint` é o coração disto.** A pergunta que o app responde não é "quanto sobra no
fim do mês", é "eu passo o mês inteiro sem furar?". Se o desenho tratar isso como mais um
número num card, a feature se perde. Quando `lowestPoint.balance < 0`, é alerta.

`daily` é uma série pronta para uma sparkline. `truncated: true` significa que a previsão não
alcança a data pedida — o app precisa dizer "previsão até tal dia" em vez de mentir.

### 3.5 Orçamento por categoria

Um teto por categoria, por mês. Só categorias de saída, nunca de sistema.

```
GET    /budgets?month=2026-08     envelope com totais + itens
POST   /budgets
PATCH  /budgets/:id               só amount
DELETE /budgets/:id
POST   /budgets/copy              { fromMonth, toMonth }
```

Cada item vem com `amount`, `spent` (só pago), `committed` (tudo lançado no mês),
`remaining`, `percent` e `status` (`OK` < 80% · `WARNING` < 100% · `OVER` ≥ 100%).

**São dois números de propósito**, e a distinção é a ideia inteira: orçamento é sobre
compromisso, não sobre caixa. A parcela que ainda não venceu **já comeu** o mês. O desenho
anterior propunha a barra medindo `committed` com `spent` como marca sólida dentro dela —
avalie se isso se lê bem no traço do canvas.

`POST /budgets/copy` existe porque não há "orçamento padrão que vale todo mês". Copiar do mês
anterior é o gesto equivalente, e precisa de um lugar óbvio na interface.

### 3.6 Metas

```
GET/POST      /goals
GET/PATCH/DELETE  /goals/:id
POST          /goals/:id/contributions      { amount, date, fromAccountId? }
DELETE        /goals/:id/contributions/:contributionId
```

Meta tem alvo, data-alvo opcional e **conta opcional**. Essa opcionalidade é a decisão central:

- **meta com conta** (tipo poupança): o aporte move dinheiro de verdade, via transferência. O
  dinheiro aparece no saldo daquela conta;
- **meta sem conta**: o aporte é só escrituração, para acompanhar algo que mora fora do app.

São duas experiências diferentes e o app precisa deixar claro qual está em jogo — senão o
usuário acha que guardou dinheiro que não saiu do lugar.

Derivados calculados pelo backend: `saved`, `progress`, `remaining`, `requiredMonthly`
("preciso guardar quanto por mês"), `pace`, `projectedDate`, `onTrack`. Sem data-alvo,
`requiredMonthly` é `null` — a interface tem que aguentar isso sem quebrar.

### 3.7 Filtros novos

`GET /transactions` ganha `accountId`. Os três endpoints do dashboard ganham `accountId`
opcional. Ou seja: **dá para ver o mês inteiro por uma conta só.** Isso é uma dimensão nova
de navegação que hoje não existe em lugar nenhum da interface.

---

## 4. O problema de navegação — a parte difícil

Hoje são quatro abas e um FAB. A fase 2 traz **quatro territórios novos**: contas, a pagar,
orçamento e metas. Eles não cabem como quatro abas novas, e enfiar tudo em "você" transforma
a aba num depósito de links.

Não vou decidir isso por você. Mas o desenho precisa responder, explicitamente:

1. **Contas** merece aba própria, ou vive como carrossel no topo de "o mês" mais uma tela
   acessada por "você"? Com uma conta só — que é o caso do autor hoje — a interface não pode
   ficar poluída por uma dimensão que ele não usa.
2. **A pagar** é um bloco na home, uma aba, ou um estado do extrato? É a informação mais
   acionável que a fase 2 produz; escondê-la em submenu desperdiça a feature.
3. **Orçamento e metas** são o mesmo tipo de coisa ("planejamento") ou moram separados?
4. O **seletor de conta** no formulário de novo lançamento: como não virar mais um campo
   obrigatório num formulário que já tem valor, categoria, data, descrição, etiquetas e uma
   seção expansível? O padrão previsto era lembrar a última conta usada.
5. **Transferência** entra pelo mesmo FAB do lançamento, ou é outro caminho?
6. Como a **previsão** convive com o saldo em "o mês" sem virar dois números competindo?

---

## 5. Regras que não se negociam

1. **Todo campo de tela mapeia para um campo real da API.** Se não existe endpoint, não
   desenhe. Se você concluir que falta um campo, **pare e escale para o autor** — não invente
   e não peça migration.
2. **Nada de fatura de cartão.** Não existe no modelo.
3. **Transferência nunca entra em agregado de receita/despesa.** Se um mockup mostrar
   transferência dentro de "para onde foi", está errado.
4. **A categoria "Transferência" nunca aparece no grid de categorias.**
5. **Não crie arquivo em `apps/mobile/`.** Esta fase é desenho.
6. O app é **solo e offline-first-ish**: um usuário, servidor próprio, sem integração
   bancária. Nada de "convidar alguém", "compartilhar" ou "conectar seu banco".
7. Preserve a voz em minúsculas e a tipografia editorial. Um card genérico de dashboard de
   fintech destrói o produto.

---

## 6. Entregue assim

- artboards 390x844 no mesmo canvas de `design/`, na linguagem visual existente;
- **o fluxo**, não só as telas: como se cria uma transferência, como se paga uma conta
  vencida, como se ajusta um orçamento no meio do mês, como se faz um aporte;
- um mapa de navegação mostrando onde cada território novo mora e o que sai/entra das abas;
- para cada tela, o endpoint que a alimenta;
- estados vazios e de carregamento **escritos na voz do produto** — eles são metade do
  charme deste app;
- o que você decidiu não desenhar, e por quê.

Ao terminar: **pare e apresente ao autor.** Ele aprova antes de qualquer implementação.
