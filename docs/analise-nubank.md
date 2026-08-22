# Análise — capturar saídas de dinheiro da conta Nubank

Objetivo: quando sair dinheiro da conta (compra no cartão, Pix enviado, débito), o lançamento
aparecer no Financi sem digitação manual.

Conclusão adiantada: **não existe API pública do Nubank para pessoa física**. Todo caminho
possível é um contorno, e eles diferem muito em custo, risco e esforço. A recomendação é
capturar a **notificação push do Android** como fonte primária e **importar extrato OFX/CSV**
como rede de segurança — e, independentemente da fonte escolhida, construir primeiro a camada
de ingestão descrita na seção "Desenho independente de fonte", que é onde mora o valor real.

---

## Os caminhos

### A. Agregador Open Finance (Pluggy, Belvo)

Empresas autorizadas que se conectam ao Nubank via Open Finance regulado (com fallback de
scraping). O usuário autoriza num widget, e o agregador entrega saldo + transações via API e
webhook.

- **Como fica:** backend registra a aplicação no agregador, o app abre o widget de conexão
  numa WebView, o backend recebe webhook `transactions/created` e materializa no inbox.
- **Prós:** é o caminho "de produto" — legal, estável, com suporte, e o que um recrutador
  reconhece como integração de verdade. Cobre outros bancos de graça.
- **Contras:** cobrança por conexão ativa em produção (checar a tabela vigente; o tier grátis
  costuma ser só sandbox). Exige backend com URL pública para webhook — o Render free
  hiberna, então precisaria de polling ou de um plano pago. Cadastro/aprovação do lado do
  agregador.
- **Esforço:** médio. **Risco:** baixo. **Custo:** o mais alto.

### B. Open Finance direto, sem intermediário

Descartado. O papel de "receptor de dados" no Open Finance brasileiro é reservado a
instituições autorizadas pelo Banco Central. Pessoa física com app próprio não se cadastra.

### C. API interna não-oficial (pynubank e similares)

A biblioteca fala com o GraphQL interno do app do Nubank. A autenticação exige gerar um
certificado a partir do CPF + senha do app, com aprovação por código; depois o certificado é
reutilizado.

- **Prós:** dados completos, sem custo.
- **Contras, e são pesados:**
  - Depende de guardar **credencial bancária real** (senha do app) e o certificado gerado.
    Num backend hospedado em tier gratuito, isso é uma superfície de risco que não compensa
    para economizar digitação.
  - Contraria os Termos de Uso do Nubank; conta pode ser bloqueada por acesso automatizado.
  - API interna muda sem aviso — a integração quebra em silêncio, e "quebrou em silêncio" num
    app de finanças significa mês inteiro sem lançamento e você não percebe.
  - Stack em Python, fora do monorepo — mais um processo pra manter.
- **Veredito:** não recomendo. Se ainda assim for adiante, o mínimo é: rodar **só na máquina
  local**, nunca no Render; certificado fora do repositório; e um alerta ativo quando a coleta
  falhar N vezes seguidas.

### D. Leitura da notificação push do Android — **recomendado**

O celular já recebe "Compra de R$ 35,90 aprovada em PADARIA X". Um
`NotificationListenerService` lê a notificação do pacote do Nubank no próprio aparelho, faz o
parse e cria um item pendente.

- **Prós:** nenhuma credencial em lugar nenhum. Nenhum termo de uso violado (é o seu aparelho
  lendo a sua própria notificação). Custo zero. Latência de segundos — chega antes de você
  esquecer o que comprou. Encaixa exatamente no espírito self-hosted do projeto.
- **Contras:**
  - Só Android. (Irrelevante aqui: o app roda em APK no Android do autor.)
  - Sai do Expo Go. Precisa de módulo nativo (`react-native-android-notification-listener` ou
    equivalente) via config plugin + EAS dev build. Vocês já usam EAS, então o custo é
    aceitável — mas o ciclo de teste rápido pelo Expo Go acaba para essa tela.
  - Permissão especial de acesso a notificações (o usuário concede numa tela do sistema) e
    isenção de otimização de bateria, senão o serviço morre.
  - **Parsing é frágil por natureza:** o texto muda quando o Nubank mexe na copy. Mitigação:
    guardar o texto cru junto com o item pendente, manter os padrões numa tabela de regras
    editável, e nunca criar transação sem confirmação humana.
  - Só captura o que o Nubank notifica. Débito automático e boleto podem não gerar push —
    daí a importância do caminho E como complemento.
- **Esforço:** médio-baixo no backend, médio no mobile (a parte nativa).
  **Risco:** baixo. **Custo:** zero.

### E. Importar extrato OFX / CSV — **recomendado como complemento**

O app do Nubank exporta OFX da conta e CSV da fatura do cartão. O usuário compartilha o
arquivo com o Financi (share sheet) e o backend faz o parse.

- **Prós:** 100% seguro e legal, dados completos e conciliados, o OFX traz `FITID` — um
  identificador estável por transação, que resolve deduplicação de graça. Serve para preencher
  o histórico anterior à instalação do app.
- **Contras:** manual, sem tempo real.
- **Esforço:** baixo. **Risco:** nenhum. **Custo:** zero.

### F. Parsing de e-mail / SMS

Descartado. O Nubank praticamente não notifica compra por e-mail, não manda SMS de transação,
e a leitura de SMS no Android é restrita pela Play Store (irrelevante aqui, mas o dado não
existe de qualquer forma).

---

## Comparativo

| | Tempo real | Credencial | Custo | Risco de quebrar | Esforço |
|---|---|---|---|---|---|
| A. Agregador | sim (webhook) | não (OAuth do agregador) | pago | baixo | médio |
| C. API não-oficial | quase | **sim, bancária** | zero | alto | médio |
| D. Notificação Android | sim | não | zero | médio (parsing) | médio |
| E. OFX/CSV | não | não | zero | baixo | baixo |

**Plano sugerido:** E primeiro (barato, valida o inbox e a deduplicação com dados reais) → D
em seguida (vira automático) → A só se quiser transformar isso em vitrine de portfólio e
aceitar a mensalidade.

---

## Desenho independente de fonte

Isto é o que vale a pena construir primeiro: as três fontes acima viram **adaptadores** que
alimentam a mesma camada. Trocar de fonte depois não mexe no domínio.

### Regra número um

Nada entra no extrato sozinho. Toda captura vira **item pendente** que o usuário confirma. Um
lançamento errado criado em silêncio corrompe saldo, orçamento e previsão de uma vez — e o
usuário perde a confiança no app inteiro.

### Modelo

```prisma
enum InboxSource {
  NOTIFICATION
  OFX
  CSV
  AGGREGATOR
}

enum InboxStatus {
  PENDING
  CONFIRMED
  DISMISSED
  DUPLICATE
}

model InboxItem {
  id            String      @id @default(uuid())
  userId        String
  accountId     String?
  source        InboxSource
  status        InboxStatus @default(PENDING)
  raw           String
  externalId    String?
  dedupHash     String
  amount        Decimal     @db.Decimal(12, 2)
  merchant      String?
  occurredAt    DateTime
  suggestedCategoryId String?
  transactionId String?     @unique
  createdAt     DateTime    @default(now())

  @@unique([userId, dedupHash])
  @@index([userId, status])
  @@map("inbox_items")
}

model MerchantRule {
  id         String   @id @default(uuid())
  userId     String
  pattern    String
  categoryId String
  accountId  String?
  hits       Int      @default(0)
  createdAt  DateTime @default(now())

  @@unique([userId, pattern])
  @@map("merchant_rules")
}
```

### Deduplicação

Duas camadas, porque a mesma compra pode chegar pela notificação **e** depois pelo OFX, e
ainda ter sido digitada à mão:

1. **Identidade forte:** `externalId` (`FITID` do OFX, id do agregador) — se já existe,
   marca `DUPLICATE` e não mostra.
2. **Identidade fraca:** `dedupHash = sha256(accountId + amount + data + merchant normalizado)`,
   com janela de tolerância de ±3 dias na data (compra no cartão cai com data diferente da
   notificação). Bate contra `InboxItem` **e** contra `Transaction` já existente — se casar
   com uma transação digitada à mão, o item vira uma sugestão de "vincular" em vez de um
   lançamento novo.

Normalização de `merchant`: caixa alta, sem acento, sem sufixo de adquirente
(`* PAG*`, `MP *`, dígitos finais).

### Categorização automática

`MerchantRule` mapeia padrão → categoria. Toda confirmação em que o usuário escolhe categoria
para um merchant novo cria/atualiza a regra e incrementa `hits`. Na terceira confirmação
igual, o item já chega com a categoria preenchida. É aprendizado suficiente sem nada de ML.

### Endpoints

| Método | Rota | Nota |
|---|---|---|
| GET | `/inbox?status=PENDING` | fila de confirmação |
| POST | `/inbox` | ingestão genérica; o app manda a notificação parseada |
| POST | `/inbox/import` | upload de OFX/CSV, multipart |
| POST | `/inbox/:id/confirm` | `{ categoryId, accountId, tags? }` → cria a `Transaction` |
| POST | `/inbox/:id/link` | vincula a uma transação existente |
| POST | `/inbox/:id/dismiss` | |

O parse da notificação fica **no app** (é lá que o texto chega) e o backend recebe já
estruturado, com o `raw` junto para auditoria. O parse de OFX/CSV fica no backend.

### Mobile

- Badge com contador na home; card "3 lançamentos para confirmar".
- `app/entrada/index.tsx` — fila com swipe: direita confirma com a categoria sugerida,
  esquerda descarta. Confirmar em lote quando todos vierem com sugestão.
- Tela de conexão em "Você": ligar/desligar a captura, status do serviço de notificação,
  botão de importar extrato.

### Impacto no que já existe

- Depende da feature 4 (Contas) — sem conta, "de onde saiu o dinheiro" não tem resposta.
- `Account` ganha `provider String?` e `externalId String?` quando entrar o caminho A.
- Convém marcar a origem no lançamento (`Transaction.origin`: `MANUAL | INBOX`) para
  distinguir na UI o que foi importado.

### Segurança e privacidade

- Nenhuma credencial bancária no backend, em nenhum dos caminhos recomendados.
- `InboxItem.raw` guarda texto que descreve compras — é dado sensível. Só sai por endpoint
  autenticado do próprio usuário, e vale um expurgo automático dos itens `CONFIRMED`/
  `DISMISSED` com mais de N dias.
- Sem telemetria de terceiros no app: a notificação lida não pode sair do aparelho para lugar
  nenhum além do backend do próprio usuário.
