import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackHeader } from '@/components/BackHeader';
import { MockupNote } from '@/components/Mockup';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { PlusIcon } from '@/components/icons';
import { money } from '@/lib/format';
import { ACCOUNTS, totalBalance } from '@/lib/mockup';
import { colors, fonts, space, tabular } from '@/theme/tokens';

export default function AccountsScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="onde o dinheiro está" />

      <View style={styles.mockup}>
        <MockupNote />
      </View>

      <View style={styles.balance}>
        <Text style={styles.balanceLabel}>tudo somado</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.currency}>R$</Text>
          <Money style={styles.balanceValue}>{money(totalBalance())}</Money>
        </View>
      </View>

      <View style={styles.list}>
        {ACCOUNTS.map((account) => (
          <Link key={account.id} href={`/conta/${account.id}`} asChild>
            <Pressable style={styles.row}>
              <View style={[styles.mark, { backgroundColor: account.color }]} />
              <View style={styles.body}>
                <Text style={styles.name}>{account.name}</Text>
                <Text style={styles.kind}>{account.kind}</Text>
              </View>
              <Money style={[styles.amount, account.balance < 0 ? styles.owed : null]}>
                {money(account.balance)}
              </Money>
            </Pressable>
          </Link>
        ))}
      </View>

      <Text style={styles.note}>
        O cartão vive negativo — pagar a fatura é mover dinheiro de uma conta para ele.
      </Text>

      <Pressable style={styles.action}>
        <PlusIcon color={colors.sage} size={15} />
        <Text style={styles.actionLabel}>nova conta</Text>
      </Pressable>

      <Pressable style={styles.action}>
        <Text style={styles.archived}>ver as arquivadas</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 24 },
  mockup: { marginTop: 14 },
  balance: { marginTop: 24, gap: 4 },
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
  list: { marginTop: 26 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: colors.ruleHair,
  },
  mark: { width: 3, height: 32, borderRadius: 2 },
  body: { flexGrow: 1, flexShrink: 1, gap: 4 },
  name: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  kind: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  amount: { fontSize: 16, color: colors.ink, ...tabular },
  owed: { color: colors.brick },
  note: {
    marginTop: 16,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 19,
    color: colors.inkFaint,
    borderTopWidth: 1,
    borderTopColor: colors.ruleHair,
    paddingTop: 16,
  },
  action: {
    marginTop: 8,
    minHeight: space.touch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.sage },
  archived: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
});
