import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useBudgets,
  useCategories,
  useCopyBudgets,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from '@/api/queries';
import { BudgetItem } from '@/api/types';
import { AmountSheet } from '@/components/AmountSheet';
import { BackHeader } from '@/components/BackHeader';
import { Meter } from '@/components/Meter';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, InlineError, Loading } from '@/components/States';
import { Stroke } from '@/components/Stroke';
import { amountToInput } from '@/lib/money';
import { money, monthName } from '@/lib/format';
import { monthKey, shiftMonth, startOfMonth } from '@/lib/month';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular } from '@/theme/tokens';

type Editing =
  | { mode: 'create'; categoryId: string; categoryName: string }
  | { mode: 'edit'; item: BudgetItem }
  | null;

export default function BudgetScreen() {
  const anchor = startOfMonth();
  const month = monthKey(anchor);
  const previous = monthKey(shiftMonth(anchor, -1));

  const query = useBudgets(month);
  const categories = useCategories('EXPENSE');
  const create = useCreateBudget();
  const update = useUpdateBudget();
  const remove = useDeleteBudget();
  const copy = useCopyBudgets();

  const [editing, setEditing] = useState<Editing>(null);

  const envelope = query.data;
  const items = envelope?.items ?? [];
  const budgeted = new Set(items.map((item) => item.categoryId));
  const loose = (categories.data ?? []).filter((category) => !budgeted.has(category.id));

  const close = () => setEditing(null);

  const confirm = (amount: number) => {
    if (!editing) return;

    if (editing.mode === 'create') {
      create.mutate({ categoryId: editing.categoryId, month, amount }, { onSuccess: close });
      return;
    }

    update.mutate({ id: editing.item.id, amount }, { onSuccess: close });
  };

  const busy = create.isPending || update.isPending || remove.isPending;

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="quanto ainda dá" />

      {query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.isPending || !envelope ? (
        <Loading label="somando os tetos" />
      ) : (
        <>
          <View style={styles.balance}>
            <Text
              style={styles.balanceLabel}
            >{`sobra do teto, em ${monthName(`${month}-01`)}`}</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.currency}>R$</Text>
              <Money style={styles.balanceValue}>
                {money(Number(envelope.totalBudgeted) - Number(envelope.totalCommitted))}
              </Money>
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

          {items.length === 0 ? (
            <EmptyState text="nenhum teto neste mês ainda" />
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.ceiling}
                  onPress={() => setEditing({ mode: 'edit', item })}
                >
                  <View style={styles.head}>
                    <Text style={styles.name}>{item.categoryName}</Text>
                    <Money
                      style={[styles.figure, item.status === 'OVER' ? styles.figureOver : null]}
                    >
                      {`${money(item.committed)} de ${money(item.amount)}`}
                    </Money>
                  </View>
                  <Meter
                    color={item.status === 'OVER' ? colors.brick : onPaper(item.color)}
                    spent={Number(item.spent) / Number(item.amount)}
                    committed={Number(item.committed) / Number(item.amount)}
                  />
                  <Text style={[styles.note, item.status === 'OVER' ? styles.noteOver : null]}>
                    {item.status === 'OVER'
                      ? `passou ${money(Math.abs(Number(item.remaining)))}`
                      : `${money(item.remaining)} ainda cabem`}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.rule} />

          <Text style={styles.section}>sem teto neste mês</Text>

          {loose.length === 0 ? (
            <Text style={styles.allSet}>toda categoria de saída já tem teto.</Text>
          ) : (
            <View style={styles.chips}>
              {loose.map((category) => (
                <Pressable
                  key={category.id}
                  style={styles.chip}
                  onPress={() =>
                    setEditing({
                      mode: 'create',
                      categoryId: category.id,
                      categoryName: category.name,
                    })
                  }
                >
                  <Text style={styles.chipLabel}>{category.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <InlineError error={create.error ?? update.error ?? remove.error ?? copy.error} />

          <View style={styles.spacer} />

          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              {`copiar os tetos de ${monthName(`${previous}-01`)} para cá`}
            </Text>
            <Pressable
              style={styles.copy}
              onPress={() => copy.mutate({ fromMonth: previous, toMonth: month })}
              disabled={copy.isPending}
            >
              <Text style={styles.copyLabel}>{copy.isPending ? 'copiando' : 'copiar'}</Text>
            </Pressable>
          </View>
        </>
      )}

      <AmountSheet
        visible={editing !== null}
        title={
          editing?.mode === 'edit'
            ? editing.item.categoryName
            : (editing?.categoryName ?? 'novo teto')
        }
        label="quanto pode gastar no mês"
        initial={editing?.mode === 'edit' ? amountToInput(editing.item.amount) : ''}
        confirmLabel={editing?.mode === 'edit' ? 'mudar o teto' : 'definir teto'}
        busy={busy}
        onConfirm={confirm}
        onRemove={
          editing?.mode === 'edit'
            ? () => remove.mutate(editing.item.id, { onSuccess: close })
            : undefined
        }
        onClose={close}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 30 },
  balance: { marginTop: 26, gap: 4 },
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
  allSet: {
    marginTop: 12,
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    color: colors.inkFaint,
  },
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
