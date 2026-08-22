import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRecurrences, useTags, useTransactions } from '@/api/queries';
import { Transaction, TransactionType } from '@/api/types';
import { Money } from '@/components/Money';
import { PickerSheet } from '@/components/PickerSheet';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { Stroke } from '@/components/Stroke';
import { ChevronDown, RepeatIcon } from '@/components/icons';
import { dayMonth, monthName, repeatLabel, signedMoney } from '@/lib/format';
import { monthKey, monthRange, shiftMonth, startOfMonth } from '@/lib/month';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

const PAGE_STEP = 50;
const MONTH_CHOICES = 18;
const ALL = 'ALL';

type TypeFilter = TransactionType | typeof ALL;
type OpenFilter = 'month' | 'type' | 'tag' | null;

const TYPE_LABELS: Record<TypeFilter, string> = {
  ALL: 'entradas e saídas',
  INCOME: 'só entradas',
  EXPENSE: 'só saídas',
};

export default function TransactionsScreen() {
  const [anchor, setAnchor] = useState(() => startOfMonth());
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(ALL);
  const [tagFilter, setTagFilter] = useState<string>(ALL);
  const [pageSize, setPageSize] = useState(PAGE_STEP);
  const [open, setOpen] = useState<OpenFilter>(null);

  const range = useMemo(() => monthRange(anchor), [anchor]);
  const filters = useMemo(
    () => ({
      ...range,
      ...(typeFilter === ALL ? {} : { type: typeFilter }),
      ...(tagFilter === ALL ? {} : { tag: tagFilter }),
      page: 1,
      pageSize,
    }),
    [range, typeFilter, tagFilter, pageSize],
  );

  const page = useTransactions(filters);
  const recurrences = useRecurrences();
  const tags = useTags();

  const intervalByRecurrence = useMemo(() => {
    const map = new Map<string, number>();
    for (const recurrence of recurrences.data ?? []) {
      map.set(recurrence.id, recurrence.intervalMonths);
    }
    return map;
  }, [recurrences.data]);

  const monthOptions = useMemo(() => {
    const today = startOfMonth();
    return Array.from({ length: MONTH_CHOICES }, (_, index) => {
      const date = shiftMonth(today, -index);
      return {
        value: monthKey(date),
        label: `${monthName(date.toISOString())} de ${date.getUTCFullYear()}`,
      };
    });
  }, []);

  const tagOptions = useMemo(
    () => [
      { value: ALL, label: 'todas' },
      ...(tags.data ?? []).map((tag) => ({ value: tag.name, label: tag.name })),
    ],
    [tags.data],
  );

  const items = page.data?.items ?? [];
  const total = page.data?.total ?? 0;
  const remaining = total - items.length;
  const month = monthName(anchor.toISOString());

  const selectMonth = (key: string) => {
    const [year, index] = key.split('-').map(Number);
    setAnchor(new Date(Date.UTC(year as number, (index as number) - 1, 1)));
    setPageSize(PAGE_STEP);
  };

  return (
    <Screen scroll gutter={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={type.title}>lançamentos</Text>
        <Text style={styles.count}>
          {page.isPending ? 'contando' : `${total} em ${month}`}
        </Text>
      </View>

      <View style={styles.filters}>
        <FilterChip label={month} active onPress={() => setOpen('month')} />
        <FilterChip
          label={TYPE_LABELS[typeFilter]}
          active={typeFilter !== ALL}
          onPress={() => setOpen('type')}
        />
        <FilterChip
          label={tagFilter === ALL ? 'todas' : tagFilter}
          active={tagFilter !== ALL}
          onPress={() => setOpen('tag')}
        />
      </View>

      {page.error ? (
        <View style={styles.gutter}>
          <ErrorState error={page.error} onRetry={() => void page.refetch()} />
        </View>
      ) : page.isPending ? (
        <Loading label="folheando o mês" />
      ) : items.length === 0 ? (
        <EmptyState text={`nada lançado em ${month}`} />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <Row
              key={item.id}
              item={item}
              intervalMonths={
                item.recurrenceId ? intervalByRecurrence.get(item.recurrenceId) : undefined
              }
            />
          ))}
        </View>
      )}

      {remaining > 0 ? (
        <Pressable style={styles.footer} onPress={() => setPageSize(pageSize + PAGE_STEP)}>
          <Text style={styles.footerLabel}>
            mais {remaining} em {month}
          </Text>
        </Pressable>
      ) : null}

      <PickerSheet
        visible={open === 'month'}
        title="que mês"
        options={monthOptions}
        value={monthKey(anchor)}
        onSelect={selectMonth}
        onClose={() => setOpen(null)}
      />

      <PickerSheet
        visible={open === 'type'}
        title="entradas ou saídas"
        options={[
          { value: ALL as TypeFilter, label: TYPE_LABELS.ALL },
          { value: 'INCOME' as TypeFilter, label: TYPE_LABELS.INCOME },
          { value: 'EXPENSE' as TypeFilter, label: TYPE_LABELS.EXPENSE },
        ]}
        value={typeFilter}
        onSelect={setTypeFilter}
        onClose={() => setOpen(null)}
      />

      <PickerSheet
        visible={open === 'tag'}
        title="que etiqueta"
        options={tagOptions}
        value={tagFilter}
        onSelect={setTagFilter}
        onClose={() => setOpen(null)}
      />
    </Screen>
  );
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable style={styles.filter} onPress={onPress}>
      <Text style={[styles.filterLabel, active ? styles.filterLabelActive : null]}>{label}</Text>
      <ChevronDown />
    </Pressable>
  );
}

interface RowProps {
  item: Transaction;
  intervalMonths: number | undefined;
}

function Row({ item, intervalMonths }: RowProps) {
  const color = onPaper(item.category.color);
  const installment =
    item.installmentNumber && item.installmentTotal
      ? `${item.installmentNumber}/${item.installmentTotal}`
      : null;

  return (
    <Link href={`/transacao/${item.id}`} asChild>
      <Pressable style={styles.row}>
        <View style={styles.dateColumn}>
          <Money style={styles.date}>{dayMonth(item.date)}</Money>
          {item.recurrenceId ? <RepeatIcon size={14} /> : null}
          {installment ? (
            <Money style={[styles.installment, { color }]}>{installment}</Money>
          ) : null}
        </View>

        <View style={styles.rowBody}>
          <Text style={type.body}>{item.description ?? item.category.name}</Text>
          <View style={styles.meta}>
            <Stroke color={color} width={14} thickness={2.4} />
            <Text style={styles.metaCategory}>{item.category.name}</Text>
            {item.tags.map((link) => (
              <Text key={link.tagId} style={styles.metaGhost}>
                {link.tag.name}
              </Text>
            ))}
            {intervalMonths ? (
              <Text style={styles.metaGhost}>{repeatLabel(intervalMonths)}</Text>
            ) : null}
          </View>
        </View>

        <Money
          style={[
            styles.amount,
            item.type === 'INCOME' ? styles.amountIncome : styles.amountExpense,
          ]}
        >
          {signedMoney(item.amount, item.type)}
        </Money>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 16 },
  gutter: { paddingHorizontal: space.gutter },
  header: {
    paddingHorizontal: space.gutter,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  count: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  filters: {
    paddingHorizontal: space.gutter,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    flexWrap: 'wrap',
  },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: space.touch },
  filterLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkFaint,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleFaint,
    paddingBottom: 2,
  },
  filterLabelActive: { color: colors.ink, borderBottomColor: colors.rule },
  list: { marginTop: 8 },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: space.gutter,
    paddingVertical: 11,
    alignItems: 'flex-start',
  },
  dateColumn: { width: 38, alignItems: 'flex-start', gap: 5, paddingTop: 1 },
  date: { fontSize: 11, color: colors.inkFaint },
  installment: { fontSize: 11, letterSpacing: 0.2 },
  rowBody: { flexGrow: 1, flexShrink: 1, gap: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  metaCategory: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  metaGhost: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkGhost },
  amount: { fontSize: 15, color: colors.ink, paddingTop: 1, ...tabular },
  amountIncome: { color: colors.sage },
  amountExpense: { color: colors.brick },
  footer: { paddingHorizontal: space.gutter, paddingTop: 14, minHeight: space.touch },
  footerLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.sage,
    alignSelf: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.sageRule,
    paddingBottom: 2,
  },
});
