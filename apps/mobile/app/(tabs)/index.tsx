import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useBalanceEvolution, useByCategory, useCategories, useSummary } from '@/api/queries';
import { CategoryTotal } from '@/api/types';
import { AccountStrip } from '@/components/AccountStrip';
import { MonthOutlook } from '@/components/MonthOutlook';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { ErrorState, Loading } from '@/components/States';
import { Stroke } from '@/components/Stroke';
import { WavyRule } from '@/components/WavyRule';
import { ChevronLeft, ChevronRight } from '@/components/icons';
import { money, monthKeyShort, monthYear } from '@/lib/format';
import { isSameMonth, monthKey, monthRange, shiftMonth, startOfMonth } from '@/lib/month';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

const VISIBLE_CATEGORIES = 6;
const MAX_STROKE = 150;
const BAR_AREA = 48;
const BAR_BELOW = 12;
const EVOLUTION_MONTHS = 6;

export default function MonthScreen() {
  const [anchor, setAnchor] = useState(() => startOfMonth());
  const [showAllCategories, setShowAllCategories] = useState(false);

  const range = useMemo(() => monthRange(anchor), [anchor]);
  const summary = useSummary(range);
  const byCategory = useByCategory({ ...range, type: 'EXPENSE' });
  const evolution = useBalanceEvolution(EVOLUTION_MONTHS);
  const categories = useCategories();

  const atCurrentMonth = isSameMonth(anchor, startOfMonth());
  const anchorKey = monthKey(anchor);

  const colorByCategory = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const category of categories.data ?? []) {
      map.set(category.id, category.color);
    }
    return map;
  }, [categories.data]);

  const totals = byCategory.data ?? [];
  const visible = showAllCategories ? totals : totals.slice(0, VISIBLE_CATEGORIES);
  const hidden = totals.length - visible.length;
  const largest = totals.reduce((peak, item) => Math.max(peak, Number(item.total)), 0);

  const points = evolution.data ?? [];
  const peak = points.reduce((max, point) => Math.max(max, Math.abs(Number(point.balance))), 0);

  const failure = summary.error ?? byCategory.error ?? evolution.error;

  const retry = () => {
    void summary.refetch();
    void byCategory.refetch();
    void evolution.refetch();
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={type.title}>{monthYear(anchor.toISOString())}</Text>
        <View style={styles.headerNav}>
          <Pressable style={styles.navButton} onPress={() => setAnchor(shiftMonth(anchor, -1))}>
            <ChevronLeft color={colors.inkFaint} />
          </Pressable>
          <Pressable
            style={styles.navButton}
            disabled={atCurrentMonth}
            onPress={() => setAnchor(shiftMonth(anchor, 1))}
          >
            <ChevronRight color={atCurrentMonth ? colors.rule : colors.inkFaint} />
          </Pressable>
        </View>
      </View>

      {atCurrentMonth ? <AccountStrip /> : null}

      {failure ? <ErrorState error={failure} onRetry={retry} /> : null}

      {!failure && summary.isPending ? <Loading label="somando o mês" /> : null}

      {!failure && summary.data ? (
        <>
          <View style={styles.balance}>
            <Text style={styles.balanceLabel}>sobrou</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.currency}>R$</Text>
              <Text style={styles.balanceValue}>{money(summary.data.balance)}</Text>
            </View>
          </View>

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>entrou</Text>
              <Money style={styles.totalIncome}>{`+${money(summary.data.totalIncome)}`}</Money>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>saiu</Text>
              <Money style={styles.totalExpense}>{`-${money(summary.data.totalExpense)}`}</Money>
            </View>
          </View>
        </>
      ) : null}

      {atCurrentMonth ? <MonthOutlook /> : null}

      <View style={styles.divider}>
        <WavyRule />
      </View>

      <Text style={styles.sectionLabel}>para onde foi</Text>

      {byCategory.isPending ? (
        <Loading label="separando por categoria" />
      ) : totals.length === 0 ? (
        <Text style={styles.blank}>nenhuma saída neste mês</Text>
      ) : (
        <View style={styles.categories}>
          {visible.map((item) => (
            <CategoryRow
              key={item.categoryId}
              item={item}
              largest={largest}
              color={colorByCategory.get(item.categoryId) ?? null}
            />
          ))}
        </View>
      )}

      {hidden > 0 || showAllCategories ? (
        <Pressable onPress={() => setShowAllCategories(!showAllCategories)}>
          <Text style={styles.more}>
            {showAllCategories
              ? 'mostrar só as maiores'
              : `mais ${hidden} ${hidden === 1 ? 'categoria' : 'categorias'}`}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.evolution}>
        <Text style={[styles.sectionLabel, styles.sectionLabelFlush]}>seis meses</Text>
        {evolution.isPending ? (
          <Loading label="desenhando a linha" />
        ) : (
          <View style={styles.bars}>
            {points.map((point) => (
              <EvolutionBar
                key={point.month}
                month={point.month}
                balance={Number(point.balance)}
                peak={peak}
                current={point.month === anchorKey}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

interface EvolutionBarProps {
  month: string;
  balance: number;
  peak: number;
  current: boolean;
}

function EvolutionBar({ month, balance, peak, current }: EvolutionBarProps) {
  const height = peak === 0 ? 2 : Math.max(2, Math.round((Math.abs(balance) / peak) * BAR_AREA));
  const negative = balance < 0;

  return (
    <View style={styles.barColumn}>
      <View style={styles.barArea}>
        {negative ? null : (
          <View
            style={[styles.bar, { height, backgroundColor: current ? colors.ink : colors.sage }]}
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
        {monthKeyShort(month)}
      </Text>
    </View>
  );
}

interface CategoryRowProps {
  item: CategoryTotal;
  largest: number;
  color: string | null;
}

function CategoryRow({ item, largest, color }: CategoryRowProps) {
  const width =
    largest === 0 ? 8 : Math.max(8, Math.round((Number(item.total) / largest) * MAX_STROKE));

  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryInfo}>
        <Text style={type.body}>{item.categoryName}</Text>
        <Stroke color={onPaper(color)} width={width} />
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
  totalExpense: { fontSize: 15, color: colors.brick },
  divider: { marginTop: 24 },
  sectionLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint, marginTop: 22 },
  sectionLabelFlush: { marginTop: 0 },
  blank: { marginTop: 14, fontFamily: fonts.serifItalic, fontSize: 15, color: colors.inkFaint },
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
