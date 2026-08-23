import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackHeader } from '@/components/BackHeader';
import { MockupNote } from '@/components/Mockup';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { Stroke } from '@/components/Stroke';
import { TransferIcon } from '@/components/icons';
import { money } from '@/lib/format';
import { MOVEMENTS, accountById } from '@/lib/mockup';
import { colors, fonts, space, tabular } from '@/theme/tokens';

export default function AccountScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const account = accountById(params.id ?? '');
  const owed = account.balance < 0;

  return (
    <Screen scroll gutter={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <BackHeader title={account.name} compact />
        <Pressable style={styles.edit}>
          <Text style={styles.editLabel}>editar</Text>
        </Pressable>
      </View>

      <View style={styles.gutter}>
        <View style={styles.mockup}>
          <MockupNote />
        </View>

        <View style={styles.balance}>
          <Text style={styles.balanceLabel}>{owed ? 'você deve' : 'tem aqui'}</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.currency}>R$</Text>
            <Money style={[styles.balanceValue, owed ? styles.owed : null]}>
              {money(Math.abs(account.balance))}
            </Money>
          </View>
          {owed ? (
            <Text style={styles.note}>
              Não há fatura nem vencimento aqui: é o saldo da conta, e ele fica negativo até você
              mover dinheiro para cá.
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Link href="/transferencia" asChild>
            <Pressable style={styles.primary}>
              <Text style={styles.primaryLabel}>
                {owed ? 'pagar este cartão' : 'mover daqui'}
              </Text>
            </Pressable>
          </Link>
          <Pressable style={styles.secondary}>
            <Text style={styles.secondaryLabel}>arquivar</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>o que passou por aqui</Text>
      </View>

      <View style={styles.list}>
        {MOVEMENTS.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.dateColumn}>
              <Money style={styles.date}>{item.date}</Money>
              {item.installment ? (
                <Money style={styles.installment}>{item.installment}</Money>
              ) : null}
              {item.transfer ? <TransferIcon /> : null}
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.meta}>
                {item.color ? <Stroke color={item.color} width={14} thickness={2.4} /> : null}
                <Text style={styles.caption}>{item.category ?? item.note}</Text>
              </View>
            </View>
            <Money
              style={[
                styles.amount,
                item.transfer ? styles.neutral : item.amount < 0 ? styles.out : styles.in,
              ]}
            >
              {item.transfer
                ? money(item.amount)
                : `${item.amount < 0 ? '-' : '+'}${money(Math.abs(item.amount))}`}
            </Money>
          </View>
        ))}
      </View>

      <View style={styles.gutter}>
        <Pressable style={styles.more}>
          <Text style={styles.moreLabel}>ver tudo desta conta</Text>
        </Pressable>
      </View>
    </Screen>
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
  edit: { minHeight: space.touch, justifyContent: 'center' },
  editLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  mockup: { marginTop: 14 },
  balance: { marginTop: 22, gap: 4 },
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
  more: { marginTop: 14, minHeight: space.touch, justifyContent: 'center' },
  moreLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
});
