import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackHeader } from '@/components/BackHeader';
import { Meter } from '@/components/Meter';
import { MockupNote } from '@/components/Mockup';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { Stroke } from '@/components/Stroke';
import { money } from '@/lib/format';
import { CEILINGS, WITHOUT_CEILING, ceilingRemaining } from '@/lib/mockup';
import { colors, fonts, space, tabular } from '@/theme/tokens';

export default function BudgetScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="quanto ainda dá" />

      <View style={styles.mockup}>
        <MockupNote />
      </View>

      <View style={styles.balance}>
        <Text style={styles.balanceLabel}>sobra do teto, em agosto</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.currency}>R$</Text>
          <Money style={styles.balanceValue}>{money(ceilingRemaining())}</Money>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Stroke color={colors.inkMuted} width={20} />
          <Text style={styles.legendLabel}>já saiu</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.faded}>
            <Stroke color={colors.inkMuted} width={20} />
          </View>
          <Text style={styles.legendLabel}>já está prometido</Text>
        </View>
      </View>

      <View style={styles.list}>
        {CEILINGS.map((item) => {
          const over = item.committed > item.amount;
          return (
            <View key={item.id} style={styles.ceiling}>
              <View style={styles.head}>
                <Text style={styles.name}>{item.name}</Text>
                <Money style={[styles.figure, over ? styles.figureOver : null]}>
                  {`${money(item.committed)} de ${money(item.amount)}`}
                </Money>
              </View>
              <Meter
                color={over ? colors.brick : item.color}
                spent={item.spent / item.amount}
                committed={item.committed / item.amount}
              />
              <Text style={[styles.note, over ? styles.noteOver : null]}>{item.note}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.rule} />

      <Text style={styles.section}>sem teto neste mês</Text>

      <View style={styles.chips}>
        {WITHOUT_CEILING.map((name) => (
          <Pressable key={name} style={styles.chip}>
            <Text style={styles.chipLabel}>{name}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <Text style={styles.footerNote}>Julho tinha os mesmos tetos.</Text>
        <Pressable style={styles.copy}>
          <Text style={styles.copyLabel}>copiar de julho</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 30 },
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
  legend: { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faded: { opacity: 0.42 },
  legendLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  list: { marginTop: 22, gap: 17 },
  ceiling: { gap: 6 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  name: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  figure: { fontSize: 13, color: colors.inkMuted, ...tabular },
  figureOver: { color: colors.brick },
  note: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.inkFaint },
  noteOver: { color: colors.brick },
  rule: { marginTop: 24, height: 1, backgroundColor: colors.ruleHair },
  section: { marginTop: 18, fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  chips: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    justifyContent: 'center',
  },
  chipLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  spacer: { flexGrow: 1, minHeight: 24 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.ruleHair,
  },
  footerNote: {
    flexShrink: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkFaint,
  },
  copy: {
    minHeight: space.touch,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.sageRule,
    justifyContent: 'center',
  },
  copyLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.sage },
});
