import { Link } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Transaction } from '@/api/types';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { Stroke } from '@/components/Stroke';
import { ChevronDown, RepeatIcon } from '@/components/icons';
import { dayMonth, monthName, repeatLabel, signedMoney } from '@/lib/format';
import { currentMonth, recurrenceById, transactionPage } from '@/mock/data';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

const FILTERS = [
  { key: 'month', label: 'agosto', active: true },
  { key: 'type', label: 'entradas e saídas', active: false },
  { key: 'tag', label: 'todas', active: false },
];

export default function TransactionsScreen() {
  const month = monthName(currentMonth);
  const remaining = transactionPage.total - transactionPage.items.length;

  return (
    <Screen scroll gutter={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={type.title}>lançamentos</Text>
        <Text style={styles.count}>
          {transactionPage.total} em {month}
        </Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((filter) => (
          <Pressable key={filter.key} style={styles.filter}>
            <Text
              style={[styles.filterLabel, filter.active ? styles.filterLabelActive : null]}
            >
              {filter.label}
            </Text>
            <ChevronDown />
          </Pressable>
        ))}
      </View>

      <View style={styles.list}>
        {transactionPage.items.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </View>

      {remaining > 0 ? (
        <Text style={styles.footer}>
          mais {remaining} em {month}
        </Text>
      ) : null}
    </Screen>
  );
}

function Row({ item }: { item: Transaction }) {
  const color = onPaper(item.category.color);
  const recurrence = item.recurrenceId ? recurrenceById(item.recurrenceId) : undefined;
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
          <Text style={type.body}>{item.description}</Text>
          <View style={styles.meta}>
            <Stroke color={color} width={14} thickness={2.4} />
            <Text style={styles.metaCategory}>{item.category.name}</Text>
            {item.tags.map((link) => (
              <Fragment key={link.tagId}>
                <Text style={styles.metaGhost}>{link.tag.name}</Text>
              </Fragment>
            ))}
            {recurrence ? (
              <Text style={styles.metaGhost}>{repeatLabel(recurrence.intervalMonths)}</Text>
            ) : null}
          </View>
        </View>

        <Money style={[styles.amount, item.type === 'INCOME' ? styles.amountIncome : null]}>
          {signedMoney(item.amount, item.type)}
        </Money>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 16 },
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
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: space.touch,
  },
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
  footer: {
    paddingHorizontal: space.gutter,
    paddingTop: 14,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.inkGhost,
  },
});
