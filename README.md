# Financi

Controle financeiro pessoal — API REST + app mobile, construídos do zero como projeto
de portfólio. Registra receitas, despesas, transferências entre contas, parcelamentos,
lançamentos recorrentes, orçamentos por categoria e metas de economia.

Não depende de nenhuma integração de terceiros: os dados são lançados pelo próprio
usuário e ficam num banco que ele controla.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Backend | Node.js 20, TypeScript, Express, Prisma, PostgreSQL |
| Mobile | React Native, Expo, Expo Router |
| Validação | Zod |
| Auth | e-mail + senha (bcrypt), JWT de acesso + refresh token rotativo |
| Testes | Jest (unitário), Supertest (E2E contra banco real), StrykerJS (mutação) |
| Qualidade | ESLint, Prettier, SonarQube |
| CI/CD | GitHub Actions, deploy no Render + Postgres no Neon |

## Modelo de domínio

`User` tem `Account` (carteira, conta corrente, cartão) e `Category` (tipada em
INCOME/EXPENSE). Toda `Transaction` é um lançamento único preso a uma conta, e pode:

- pertencer a uma `Recurrence` — template com intervalo em meses, cujas ocorrências são
  pré-geradas em lote numa janela móvel de 12 meses;
- fazer parte de um parcelamento — N transações com o mesmo `installmentGroupId`, o
  resto do arredondamento indo na última;
- formar uma transferência — um par de transações com o mesmo `transferGroupId`, uma
  saída na conta de origem e uma entrada no destino, excluídas de todo agregado de
  receita/despesa;
- carregar `Tag` livres, criadas em tempo de escrita.

`Budget` é um teto por categoria e mês. `Goal` acumula `GoalContribution` e tem o
progresso sempre derivado, nunca persistido.

O campo `paid` separa o que de fato aconteceu do que está apenas agendado — ocorrências
futuras de recorrência e parcelas não vencidas são o lado pendente.

## Rodando localmente

Pré-requisitos: Node.js 20, Docker.

O Postgres local sobe na porta **5439** para não colidir com uma instalação nativa.

```bash
docker compose up -d
```

### Backend

```bash
cd apps/backend && cp .env.example .env && npm ci && npm run prisma:migrate:dev && npm run dev
```

A API sobe em `http://localhost:3000`. A especificação OpenAPI fica em
`apps/backend/openapi.yaml` e é servida com Swagger UI em `/docs` fora de produção.

### Mobile

```bash
cd apps/mobile && cp .env.example .env && npm ci && npm start
```

Aponte `EXPO_PUBLIC_API_URL` para o backend local e abra pelo Expo Go.

## Testes e qualidade

```bash
npm run test:unit
```

```bash
npm run test:e2e
```

```bash
npm run test:coverage -- --runInBand
```

Os testes E2E rodam contra um banco Postgres real (`financi_test`), não contra mocks.
`npm run test:mutation` roda o StrykerJS sobre a lógica de negócio.

## Arquitetura

Monorepo com `apps/backend` e `apps/mobile`. O backend é organizado por domínio, não
por tipo de arquivo: cada pasta em `src/modules/<domínio>/` carrega suas próprias
rotas, controller, service e schema. Código transversal fica em `src/config/`,
`src/middlewares/` e `src/utils/`.

## Licença

MIT — veja [LICENSE](LICENSE).
