import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackHeader } from '@/components/BackHeader';
import { Meter } from '@/components/Meter';
import { MockupNote } from '@/components/Mockup';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { money } from '@/lib/format';
import { CONTRIBUTIONS, goalById } from '@/lib/mockup';
import { colors, fonts, space, tabular } from '@/theme/tokens';

export default function GoalScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const goal = goalById(params.id ?? '');
  const remaining = goal.target - goal.saved;

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <BackHeader title={goal.name} compact />
        <Pressable style={styles.edit}>
          <Text style={styles.editLabel}>editar</Text>
        </Pressable>
      </View>

      <View style={styles.mockup}>
        <MockupNote />
      </View>

      <View style={styles.balance}>
        <Text style={styles.balanceLabel}>você já juntou</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.currency}>R$</Text>
          <Money style={styles.balanceValue}>{money(goal.saved)}</Money>
        </View>
      </View>

      <View style={styles.meter}>
        <Meter color={colors.sage} spent={goal.saved / goal.target} committed={0} />
      </View>

      <View style={styles.figures}>
        <Money style={styles.figure}>{`faltam ${money(remaining)}`}</Money>
        <Money style={styles.figure}>
          {goal.targetLabel
            ? `alvo ${money(goal.target)} · ${goal.targetLabel}`
            : `alvo ${money(goal.target)}`}
        </Money>
      </View>

      <View style={styles.pace}>
        {goal.requiredMonthly ? (
          <Text style={styles.paceTitle}>{`${money(goal.requiredMonthly)} por mês até lá`}</Text>
        ) : (
          <Text style={styles.paceTitle}>sem data marcada</Text>
        )}
        <Text style={styles.paceBody}>{goal.pace}</Text>
      </View>

      <View style={styles.where}>
        <View
          style={[styles.mark, { backgroundColor: goal.accountName ? '#4FC7B6' : colors.rule }]}
        />
        <View style={styles.whereBody}>
          <Text style={styles.whereTitle}>
            {goal.accountName ? `o dinheiro está na ${goal.accountName}` : 'nenhuma conta ligada'}
          </Text>
          <Text style={styles.whereNote}>
            {goal.accountName
              ? 'guardar aqui move dinheiro de verdade'
              : 'guardar aqui só anota — nenhuma conta se mexe'}
          </Text>
        </View>
      </View>

      <Link href="/meta/aporte" asChild>
        <Pressable style={styles.save}>
          <Text style={styles.saveLabel}>guardar um pouco</Text>
        </Pressable>
      </Link>

      <Text style={styles.section}>o que você já guardou</Text>

      <View style={styles.list}>
        {CONTRIBUTIONS.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.dateColumn}>
              <Money style={styles.date}>{item.date}</Money>
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{item.origin}</Text>
              <Text style={styles.caption}>{item.detail}</Text>
            </View>
            <Money style={styles.amount}>{money(item.amount)}</Money>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  meter: { marginTop: 18 },
  figures: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  figure: { fontSize: 13, color: colors.inkFaint, ...tabular },
  pace: {
    marginTop: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.ruleHair,
    gap: 10,
  },
  paceTitle: { fontFamily: fonts.serifItalic, fontSize: 18, color: colors.ink },
  paceBody: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: colors.inkMuted },
  where: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 3, height: 30, borderRadius: 2 },
  whereBody: { flexGrow: 1, flexShrink: 1, gap: 3 },
  whereTitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  whereNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  save: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.sageRule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.sage },
  section: { marginTop: 28, fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  list: { marginTop: 14 },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: colors.ruleHair,
  },
  dateColumn: { width: 38, paddingTop: 1 },
  date: { fontSize: 11, color: colors.inkFaint, ...tabular },
  body: { flexGrow: 1, flexShrink: 1, gap: 4 },
  name: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  caption: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  amount: { fontSize: 15, color: colors.ink, marginTop: 1, ...tabular },
});
