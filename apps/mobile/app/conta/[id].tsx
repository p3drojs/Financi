import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccount, useUpdateAccount } from '@/api/queries';
import { Transaction } from '@/api/types';
import { BackHeader } from '@/components/BackHeader';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, InlineError, Loading } from '@/components/States';
import { Stroke } from '@/components/Stroke';
import { TransferIcon } from '@/components/icons';
import { kindLabel } from '@/lib/account';
import { dayMonth, money } from '@/lib/format';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular } from '@/theme/tokens';

export default function AccountScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useAccount(params.id);
  const update = useUpdateAccount(params.id ?? '');

  const account = query.data;
  const owed = account ? Number(account.balance) < 0 : false;

  const confirmArchive = () => {
    Alert.alert(
      'arquivar esta conta',
      'ela some da lista, mas os lançamentos dela continuam no histórico.',
      [
        { text: 'deixar como está', style: 'cancel' },
        {
          text: 'arquivar',
          onPress: () => update.mutate({ archived: true }, { onSuccess: () => router.back() }),
        },
      ],
    );
  };

  if (query.error) {
    return (
      <Screen>
        <BackHeader title="uma conta" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  if (query.isPending || !account) {
    return (
      <Screen>
        <BackHeader title="uma conta" />
        <Loading label="abrindo a conta" />
      </Screen>
    );
  }

  return (
    <Screen scroll gutter={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <BackHeader title={account.name} compact />
        <Text style={styles.kind}>{kindLabel(account.kind)}</Text>
      </View>

      <View style={styles.gutter}>
        <View style={styles.balance}>
          <Text style={styles.balanceLabel}>{owed ? 'você deve' : 'tem aqui'}</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.currency}>R$</Text>
            <Money style={[styles.balanceValue, owed ? styles.owed : null]}>
              {money(Math.abs(Number(account.balance)))}
            </Money>
          </View>
          {account.kind === 'CREDIT_CARD' ? (
            <Text style={styles.note}>
              Não há fatura nem vencimento aqui: é o saldo da conta, e ele fica negativo até você
              mover dinheiro para cá.
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.primary}
            onPress={() =>
              router.push({
                pathname: '/transferencia',
                params: owed ? { toAccountId: account.id } : { fromAccountId: account.id },
              })
            }
          >
            <Text style={styles.primaryLabel}>{owed ? 'pagar este cartão' : 'mover daqui'}</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={confirmArchive} disabled={update.isPending}>
            <Text style={styles.secondaryLabel}>
              {update.isPending ? 'arquivando' : 'arquivar'}
            </Text>
          </Pressable>
        </View>

        <InlineError error={update.error} />

        <Text style={styles.section}>o que passou por aqui</Text>
      </View>

      {account.transactions.length === 0 ? (
        <EmptyState text="nada passou por esta conta ainda" />
      ) : (
        <View style={styles.list}>
          {account.transactions.map((transaction) => (
            <MovementRow key={transaction.id} transaction={transaction} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function MovementRow({ transaction }: { transaction: Transaction }) {
  const isTransfer = Boolean(transaction.transferGroupId);
  const incoming = transaction.type === 'INCOME';
  const label = isTransfer
    ? incoming
      ? 'veio de outra conta'
      : 'foi para outra conta'
    : (transaction.description ?? transaction.category.name);

  return (
    <View style={[styles.row, transaction.paid ? null : styles.rowPending]}>
      <View style={styles.dateColumn}>
        <Money style={styles.date}>{dayMonth(transaction.date)}</Money>
        {transaction.installmentNumber ? (
          <Money style={styles.installment}>
            {`${transaction.installmentNumber}/${transaction.installmentTotal}`}
          </Money>
        ) : null}
        {isTransfer ? <TransferIcon /> : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>{label}</Text>
        <View style={styles.meta}>
          {isTransfer ? null : (
            <Stroke color={onPaper(transaction.category.color)} width={14} thickness={2.4} />
          )}
          <Text style={styles.caption}>
            {isTransfer ? 'o dinheiro só mudou de lugar' : transaction.category.name}
          </Text>
        </View>
      </View>

      <Money
        style={[styles.amount, isTransfer ? styles.neutral : incoming ? styles.in : styles.out]}
      >
        {isTransfer
          ? money(transaction.amount)
          : `${incoming ? '+' : '-'}${money(transaction.amount)}`}
      </Money>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 24 },
  gutter: { paddingHorizontal: space.gutter },
  header: {
    paddingHorizontal: space.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kind: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  balance: { marginTop: 26, gap: 4 },
  balanceLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  currency: { fontFamily: fonts.serif, fontSize: 21, color: colors.inkFaint },
  balanceValue: {
    fontFamily: fonts.serifThin,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -1.1,
    color: colors.ink,
    ...tabular,
  },
  owed: { color: colors.brick },
  note: {
    marginTop: 6,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 19,
    color: colors.inkFaint,
  },
  actions: { marginTop: 22, flexDirection: 'row', gap: 10 },
  primary: {
    flexGrow: 1,
    minHeight: space.touch,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.sageRule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.sage },
  secondary: {
    minHeight: space.touch,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted },
  section: { marginTop: 28, fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  list: { marginTop: 12 },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: space.gutter,
    paddingVertical: 11,
    alignItems: 'flex-start',
  },
  rowPending: { opacity: 0.62 },
  dateColumn: { width: 38, gap: 5, paddingTop: 1 },
  date: { fontSize: 11, color: colors.inkFaint, ...tabular },
  installment: { fontSize: 11, color: '#F9C063', letterSpacing: 0.2, ...tabular },
  body: { flexGrow: 1, flexShrink: 1, gap: 5 },
  name: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  caption: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  amount: { fontSize: 15, marginTop: 1, ...tabular },
  in: { color: colors.sage },
  out: { color: colors.brick },
  neutral: { color: colors.inkMuted },
});
