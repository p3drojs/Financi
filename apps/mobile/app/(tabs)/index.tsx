import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryTotal } from '@/api/types';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { Stroke } from '@/components/Stroke';
import { WavyRule } from '@/components/WavyRule';
import { ChevronLeft, ChevronRight } from '@/components/icons';
import { money, monthKeyShort, monthYear } from '@/lib/format';
import { balanceEvolution, byCategory, categoryById, currentMonth, summary } from '@/mock/data';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

const VISIBLE_CATEGORIES = 6;
const MAX_STROKE = 150;
const BAR_AREA = 48;
const BAR_BELOW = 12;

export default function MonthScreen() {
  const visible = byCategory.slice(0, VISIBLE_CATEGORIES);
  const hidden = byCategory.length - visible.length;
  const largest = Math.max(...byCategory.map((item) => Number(item.total)));
  const peak = Math.max(...balanceEvolution.map((point) => Math.abs(Number(point.balance))));
  const currentKey = balanceEvolution[balanceEvolution.length - 1]?.month;

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={type.title}>{monthYear(currentMonth)}</Text>
        <View style={styles.headerNav}>
          <Pressable style={styles.navButton}>
            <ChevronLeft color={colors.inkFaint} />
          </Pressable>
          <Pressable style={styles.navButton} disabled>
            <ChevronRight color={colors.rule} />
          </Pressable>
        </View>
      </View>

      <View style={styles.balance}>
        <Text style={styles.balanceLabel}>sobrou</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.currency}>R$</Text>
          <Text style={styles.balanceValue}>{money(summary.balance)}</Text>
        </View>
      </View>

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>entrou</Text>
          <Money style={styles.totalIncome}>{money(summary.totalIncome)}</Money>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>saiu</Text>
          <Money style={styles.totalExpense}>{money(summary.totalExpense)}</Money>
        </View>
      </View>

      <View style={styles.divider}>
        <WavyRule />
      </View>

      <Text style={styles.sectionLabel}>para onde foi</Text>

      <View style={styles.categories}>
        {visible.map((item) => (
          <CategoryRow key={item.categoryId} item={item} largest={largest} />
        ))}
      </View>

      {hidden > 0 ? (
        <Text style={styles.more}>
          mais {hidden} {hidden === 1 ? 'categoria' : 'categorias'}
        </Text>
      ) : null}

      <View style={styles.evolution}>
        <Text style={[styles.sectionLabel, styles.sectionLabelFlush]}>seis meses</Text>
        <View style={styles.bars}>
          {balanceEvolution.map((point) => {
            const value = Number(point.balance);
            const height = Math.max(2, Math.round((Math.abs(value) / peak) * BAR_AREA));
            const negative = value < 0;
            const current = point.month === currentKey;

            return (
              <View key={point.month} style={styles.barColumn}>
                <View style={styles.barArea}>
                  {negative ? null : (
                    <View
                      style={[
                        styles.bar,
                        { height, backgroundColor: current ? colors.ink : colors.sage },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.axis} />
                <View style={styles.barBelow}>
                  {negative ? (
                    <View
                      style={[
                        styles.bar,
                        { height: Math.min(height, BAR_BELOW), backgroundColor: colors.brick },
                      ]}
                    />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.barLabel,
                    negative ? styles.barLabelNegative : null,
                    current ? styles.barLabelCurrent : null,
                  ]}
                >
                  {monthKeyShort(point.month)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

function CategoryRow({ item, largest }: { item: CategoryTotal; largest: number }) {
  const width = Math.max(8, Math.round((Number(item.total) / largest) * MAX_STROKE));
  const color = onPaper(categoryById(item.categoryId).color);

  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryInfo}>
        <Text style={type.body}>{item.categoryName}</Text>
        <Stroke color={color} width={width} />
      </View>
      <Money style={styles.categoryTotal}>{money(item.total)}</Money>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 16 },
  header: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerNav: { flexDirection: 'row', marginRight: -12 },
  navButton: {
    width: space.touch,
    height: space.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balance: { marginTop: 34, gap: 4 },
  balanceLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  currency: { fontFamily: fonts.serif, fontSize: 21, color: colors.inkFaint },
  balanceValue: {
    fontFamily: fonts.serifThin,
    fontSize: 58,
    lineHeight: 62,
    letterSpacing: -1.4,
    color: colors.ink,
    ...tabular,
  },
  totals: { marginTop: 22, gap: 11 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  totalLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted },
  totalIncome: { fontSize: 15, color: colors.sage },
  totalExpense: { fontSize: 15, color: colors.ink },
  divider: { marginTop: 24 },
  sectionLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint, marginTop: 22 },
  sectionLabelFlush: { marginTop: 0 },
  categories: { marginTop: 16, gap: 11 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryInfo: { flexGrow: 1, gap: 5 },
  categoryTotal: { fontSize: 14, color: colors.inkMuted },
  more: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint, marginTop: 14 },
  evolution: { marginTop: 22, gap: 12, paddingBottom: 8 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  barColumn: { flexGrow: 1, alignItems: 'center', gap: 6 },
  barArea: { height: BAR_AREA, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: 4, borderRadius: 2 },
  axis: { width: '100%', height: 1, backgroundColor: colors.ruleSoft },
  barBelow: { height: BAR_BELOW, alignItems: 'center', justifyContent: 'flex-start' },
  barLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.inkFaint },
  barLabelNegative: { color: colors.brick },
  barLabelCurrent: { color: colors.ink },
});
