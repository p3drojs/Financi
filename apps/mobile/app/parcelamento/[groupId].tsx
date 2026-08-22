import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useInstallmentGroup } from '@/api/queries';
import { InstallmentGroup, Transaction } from '@/api/types';
import { BackHeader } from '@/components/BackHeader';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { ErrorState, Loading } from '@/components/States';
import { Stroke } from '@/components/Stroke';
import { WavyRule } from '@/components/WavyRule';
import { fullDate, money, ordinal } from '@/lib/format';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, tabular, type } from '@/theme/tokens';

export default function InstallmentGroupScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const query = useInstallmentGroup(groupId);

  return (
    <Screen scroll contentStyle={styles.content}>
      {query.isPending ? (
        <>
          <BackHeader title="parcelamento" compact />
          <Loading label="somando as parcelas" />
        </>
      ) : query.error ? (
        <>
          <BackHeader title="parcelamento" compact />
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </>
      ) : query.data ? (
        <GroupBody group={query.data} />
      ) : null}
    </Screen>
  );
}

function GroupBody({ group }: { group: InstallmentGroup }) {
  const color = onPaper(group.category.color);
  const tags = group.transactions[0]?.tags ?? [];
  const nextNumber = group.paidCount + 1;
  const regularAmount = group.transactions[0]?.amount;

  return (
    <>
      <BackHeader title={group.description ?? 'parcelamento'} compact />

      <View style={styles.meta}>
        <Stroke color={color} width={20} />
        <Text style={styles.category}>{group.category.name}</Text>
        {tags.map((link) => (
          <Text key={link.tagId} style={styles.tag}>
            {link.tag.name}
          </Text>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.currency}>R$</Text>
        <Text style={styles.total}>{money(group.totalAmount)}</Text>
        <Text style={styles.totalSuffix}>em {group.installmentTotal}</Text>
      </View>

      <View style={styles.tally}>
        {group.transactions.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.tallyMark,
              { backgroundColor: index < group.paidCount ? colors.ink : colors.track },
            ]}
          />
        ))}
      </View>

      <View style={styles.progress}>
        <Text style={styles.progressLabel}>
          {group.paidCount} de {group.installmentTotal} já venceram
        </Text>
        <Text style={type.caption}>contadas pela data — não dá para marcar uma como paga</Text>
        <Text style={styles.remaining}>faltam R$ {money(group.remainingAmount)}</Text>
      </View>

      <View style={styles.divider}>
        <WavyRule />
      </View>

      <View style={styles.rows}>
        {group.transactions.map((item) => (
          <InstallmentRow
            key={item.id}
            item={item}
            paid={(item.installmentNumber ?? 0) <= group.paidCount}
            next={item.installmentNumber === nextNumber}
            carriesRemainder={item.amount !== regularAmount}
          />
        ))}
      </View>
    </>
  );
}

interface RowProps {
  item: Transaction;
  paid: boolean;
  next: boolean;
  carriesRemainder: boolean;
}

function InstallmentRow({ item, paid, next, carriesRemainder }: RowProps) {
  const highlighted = next || carriesRemainder;

  return (
    <View style={styles.row}>
      <Money
        style={[
          styles.number,
          paid ? styles.numberPaid : null,
          highlighted ? styles.numberActive : null,
        ]}
      >
        {ordinal(item.installmentNumber ?? 0)}
      </Money>

      <View style={styles.rowMiddle}>
        <Money
          style={[styles.date, paid ? styles.textPaid : null, next ? styles.textCurrent : null]}
        >
          {fullDate(item.date)}
        </Money>
        {next ? <Text style={styles.marker}>a próxima</Text> : null}
        {carriesRemainder ? <Text style={styles.markerStrong}>leva o resto</Text> : null}
      </View>

      <Money
        style={[
          styles.amount,
          paid ? styles.textPaid : null,
          next || carriesRemainder ? styles.textCurrent : null,
        ]}
      >
        {money(item.amount)}
      </Money>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  meta: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  category: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  tag: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkGhost },
  totalRow: { marginTop: 18, flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  currency: { fontFamily: fonts.serif, fontSize: 17, color: colors.inkFaint },
  total: {
    fontFamily: fonts.serifThin,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: colors.ink,
    ...tabular,
  },
  totalSuffix: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkFaint },
  tally: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    height: 24,
    flexWrap: 'wrap',
  },
  tallyMark: { width: 2, height: 20, borderRadius: 1, transform: [{ rotate: '-8deg' }] },
  progress: { marginTop: 12, gap: 3 },
  progressLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  remaining: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint, marginTop: 4 },
  divider: { marginTop: 22 },
  rows: { marginTop: 10 },
  row: { height: 42, flexDirection: 'row', alignItems: 'center', gap: 16 },
  number: { fontSize: 12, width: 20, color: colors.inkFaint },
  numberPaid: { color: colors.inkGhost, textDecorationLine: 'line-through' },
  numberActive: { color: colors.inkMuted, textDecorationLine: 'none' },
  rowMiddle: { flexGrow: 1, flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  date: { fontSize: 14, color: colors.inkMuted },
  amount: { fontSize: 14, color: colors.inkMuted },
  textPaid: { color: colors.inkFaint },
  textCurrent: { color: colors.ink },
  marker: { fontFamily: fonts.serifItalic, fontSize: 12, color: colors.inkFaint },
  markerStrong: { fontFamily: fonts.serifItalic, fontSize: 13, color: colors.ink },
});
