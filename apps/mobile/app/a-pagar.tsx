import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePayTransactions, useUpcoming } from '@/api/queries';
import { Transaction } from '@/api/types';
import { BackHeader } from '@/components/BackHeader';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, InlineError, Loading } from '@/components/States';
import { Stroke } from '@/components/Stroke';
import { CheckIcon } from '@/components/icons';
import { dayMonth, money } from '@/lib/format';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular } from '@/theme/tokens';

export default function DueScreen() {
  const query = useUpcoming();
  const pay = usePayTransactions();
  const [picked, setPicked] = useState<string[]>([]);

  const overdue = query.data?.overdue.items ?? [];
  const upcoming = query.data?.upcoming.items ?? [];
  const all = [...overdue, ...upcoming];
  const chosen = all.filter((item) => picked.includes(item.id));
  const chosenTotal = chosen.reduce((sum, item) => sum + Number(item.amount), 0);

  const toggle = (id: string) =>
    setPicked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const confirm = () => {
    if (chosen.length === 0) return;
    pay.mutate(
      chosen.map((item) => item.id),
      { onSuccess: () => setPicked([]) },
    );
  };

  return (
    <Screen scroll gutter={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <BackHeader title="a pagar" />
        <Text style={styles.window}>próximos 7 dias</Text>
      </View>

      {query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Loading label="vendo o que vence" />
      ) : all.length === 0 ? (
        <EmptyState text="nada vencido e nada vencendo — bom sinal" />
      ) : (
        <>
          {overdue.length > 0 ? (
            <>
              <View style={[styles.gutter, styles.sectionHead]}>
                <Text style={styles.overdueTitle}>venceu</Text>
                <Money style={styles.overdueTotal}>
                  {`-${money(query.data?.overdue.total ?? 0)}`}
                </Money>
              </View>
              <View style={styles.list}>
                {overdue.map((item) => (
                  <DueRow
                    key={item.id}
                    transaction={item}
                    overdue
                    picked={picked.includes(item.id)}
                    onToggle={() => toggle(item.id)}
                  />
                ))}
              </View>
            </>
          ) : null}

          {upcoming.length > 0 ? (
            <>
              <View style={[styles.gutter, styles.sectionHead]}>
                <Text style={styles.comingTitle}>vem aí</Text>
                <Money style={styles.comingTotal}>
                  {`-${money(query.data?.upcoming.total ?? 0)}`}
                </Money>
              </View>
              <View style={styles.list}>
                {upcoming.map((item) => (
                  <DueRow
                    key={item.id}
                    transaction={item}
                    overdue={false}
                    picked={picked.includes(item.id)}
                    onToggle={() => toggle(item.id)}
                  />
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.gutter}>
            <InlineError error={pay.error} />
          </View>

          <View style={styles.spacer} />

          <View style={styles.footer}>
            <View style={styles.footerBody}>
              <Text style={styles.footerLabel}>
                {chosen.length === 1 ? '1 escolhido' : `${chosen.length} escolhidos`}
              </Text>
              <Money style={styles.footerTotal}>{`R$ ${money(chosenTotal)}`}</Money>
            </View>
            <Pressable
              style={[styles.pay, chosen.length === 0 ? styles.payBlocked : null]}
              onPress={confirm}
              disabled={chosen.length === 0 || pay.isPending}
            >
              <Text style={[styles.payLabel, chosen.length === 0 ? styles.payLabelBlocked : null]}>
                {pay.isPending ? 'marcando' : 'marcar como pago'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}

interface DueRowProps {
  transaction: Transaction;
  overdue: boolean;
  picked: boolean;
  onToggle: () => void;
}

function DueRow({ transaction, overdue, picked, onToggle }: DueRowProps) {
  return (
    <Pressable onPress={onToggle} style={[styles.row, overdue ? null : styles.rowPending]}>
      <View style={styles.check}>
        <View style={[styles.dot, picked ? styles.dotPicked : null]}>
          {picked ? <CheckIcon /> : null}
        </View>
      </View>

      <View style={styles.dateColumn}>
        <Money style={[styles.date, overdue ? styles.dateOverdue : null]}>
          {dayMonth(transaction.date)}
        </Money>
        {transaction.installmentNumber ? (
          <Money style={styles.installment}>
            {`${transaction.installmentNumber}/${transaction.installmentTotal}`}
          </Money>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>{transaction.description ?? transaction.category.name}</Text>
        <View style={styles.meta}>
          <Stroke color={onPaper(transaction.category.color)} width={14} thickness={2.4} />
          <Text style={styles.caption}>{transaction.category.name}</Text>
          {transaction.recurrenceId ? <Text style={styles.caption}>se repete</Text> : null}
        </View>
      </View>

      <Money style={styles.amount}>{`-${money(transaction.amount)}`}</Money>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  gutter: { paddingHorizontal: space.gutter },
  header: {
    paddingHorizontal: space.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  window: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  sectionHead: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  overdueTitle: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.brick },
  overdueTotal: { fontSize: 13, color: colors.brick, ...tabular },
  comingTitle: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.inkMuted },
  comingTotal: { fontSize: 13, color: colors.inkFaint, ...tabular },
  list: { marginTop: 10 },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: space.gutter,
    paddingVertical: 11,
    alignItems: 'flex-start',
  },
  rowPending: { opacity: 0.62 },
  check: { width: 18, paddingTop: 2 },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotPicked: { backgroundColor: colors.ink, borderColor: colors.ink },
  dateColumn: { width: 38, gap: 5, paddingTop: 1 },
  date: { fontSize: 11, color: colors.inkFaint, ...tabular },
  dateOverdue: { color: colors.brick },
  installment: { fontSize: 11, color: '#F9C063', letterSpacing: 0.2, ...tabular },
  body: { flexGrow: 1, flexShrink: 1, gap: 5 },
  name: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  caption: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  amount: { fontSize: 15, color: colors.brick, marginTop: 1, ...tabular },
  spacer: { flexGrow: 1, minHeight: 20 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: space.gutter,
    paddingTop: 16,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: colors.ruleHair,
  },
  footerBody: { gap: 3 },
  footerLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  footerTotal: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink, ...tabular },
  pay: {
    minHeight: space.touch,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.sageRule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBlocked: { borderColor: colors.ruleSoft },
  payLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.sage },
  payLabelBlocked: { color: colors.inkFaint },
});
