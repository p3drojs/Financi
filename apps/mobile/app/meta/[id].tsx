import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccounts, useDeleteGoal, useGoal, useRemoveContribution } from '@/api/queries';
import { BackHeader } from '@/components/BackHeader';
import { Meter } from '@/components/Meter';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, InlineError, Loading } from '@/components/States';
import { dayMonth, money, monthYear } from '@/lib/format';
import { colors, fonts, space, tabular } from '@/theme/tokens';

export default function GoalScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useGoal(params.id);
  const accounts = useAccounts();
  const removeGoal = useDeleteGoal();
  const removeContribution = useRemoveContribution(params.id ?? '');

  const goal = query.data;
  const vault = (accounts.data ?? []).find((account) => account.id === goal?.accountId);

  const confirmDelete = () => {
    Alert.alert(
      'apagar esta meta',
      'os aportes somem junto. os lançamentos que financiaram continuam no extrato.',
      [
        { text: 'deixar como está', style: 'cancel' },
        {
          text: 'apagar',
          style: 'destructive',
          onPress: () => removeGoal.mutate(params.id as string, { onSuccess: () => router.back() }),
        },
      ],
    );
  };

  if (query.error) {
    return (
      <Screen>
        <BackHeader title="uma meta" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  if (query.isPending || !goal) {
    return (
      <Screen>
        <BackHeader title="uma meta" />
        <Loading label="conferindo o quanto falta" />
      </Screen>
    );
  }

  const achieved = Number(goal.remaining) === 0;

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <BackHeader title={goal.name} compact />
        <Pressable style={styles.delete} onPress={confirmDelete}>
          <Text style={styles.deleteLabel}>apagar</Text>
        </Pressable>
      </View>

      <View style={styles.balance}>
        <Text style={styles.balanceLabel}>você já juntou</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.currency}>R$</Text>
          <Money style={styles.balanceValue}>{money(goal.saved)}</Money>
        </View>
      </View>

      <View style={styles.meter}>
        <Meter
          color={colors.sage}
          spent={Number(goal.saved) / Number(goal.targetAmount)}
          committed={0}
        />
      </View>

      <View style={styles.figures}>
        <Money style={styles.figure}>
          {achieved ? 'chegou no alvo' : `faltam ${money(goal.remaining)}`}
        </Money>
        <Money style={styles.figure}>
          {goal.targetDate
            ? `alvo ${money(goal.targetAmount)} · ${monthYear(goal.targetDate)}`
            : `alvo ${money(goal.targetAmount)}`}
        </Money>
      </View>

      <View style={styles.pace}>
        <Text style={styles.paceTitle}>
          {goal.requiredMonthly
            ? `${money(goal.requiredMonthly)} por mês até lá`
            : goal.targetDate
              ? 'a data-alvo já passou'
              : 'sem data marcada'}
        </Text>
        <Text style={styles.paceBody}>{paceSentence(goal)}</Text>
      </View>

      <View style={styles.where}>
        <View style={[styles.mark, { backgroundColor: vault ? '#4FC7B6' : colors.rule }]} />
        <View style={styles.whereBody}>
          <Text style={styles.whereTitle}>
            {vault ? `o dinheiro está na ${vault.name}` : 'nenhuma conta ligada'}
          </Text>
          <Text style={styles.whereNote}>
            {vault
              ? 'guardar aqui move dinheiro de verdade'
              : 'guardar aqui só anota — nenhuma conta se mexe'}
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.save}
        onPress={() => router.push({ pathname: '/meta/aporte', params: { goalId: goal.id } })}
      >
        <Text style={styles.saveLabel}>guardar um pouco</Text>
      </Pressable>

      <InlineError error={removeGoal.error ?? removeContribution.error} />

      <Text style={styles.section}>o que você já guardou</Text>

      {goal.contributions.length === 0 ? (
        <EmptyState text="nenhum aporte ainda" />
      ) : (
        <View style={styles.list}>
          {goal.contributions.map((contribution) => (
            <Pressable
              key={contribution.id}
              style={styles.row}
              onLongPress={() => removeContribution.mutate(contribution.id)}
            >
              <View style={styles.dateColumn}>
                <Money style={styles.date}>{dayMonth(contribution.date)}</Money>
              </View>
              <View style={styles.body}>
                <Text style={styles.name}>
                  {contribution.transactionId ? 'saiu de uma conta' : 'só anotado'}
                </Text>
                <Text style={styles.caption}>
                  {contribution.transactionId
                    ? 'virou transferência no extrato'
                    : 'nenhuma conta se mexeu'}
                </Text>
              </View>
              <Money style={styles.amount}>{money(contribution.amount)}</Money>
            </Pressable>
          ))}
        </View>
      )}

      {goal.contributions.length > 0 ? (
        <Text style={styles.hint}>segure um aporte para apagar</Text>
      ) : null}
    </Screen>
  );
}

function paceSentence(goal: {
  pace: string | null;
  projectedDate: string | null;
  onTrack: boolean | null;
  remaining: string;
}): string {
  if (Number(goal.remaining) === 0) return 'meta batida. o dinheiro já está guardado.';
  if (!goal.pace) return 'ainda não dá para ver um ritmo — falta histórico de aportes.';

  const projected = goal.projectedDate ? monthYear(goal.projectedDate) : null;

  if (!projected) return `no ritmo de ${money(goal.pace)} por mês.`;
  if (goal.onTrack === false) {
    return `no ritmo de ${money(goal.pace)} por mês você chega em ${projected}, depois do que combinou consigo mesmo.`;
  }

  return `no ritmo de ${money(goal.pace)} por mês você chega em ${projected}.`;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  delete: { minHeight: space.touch, justifyContent: 'center' },
  deleteLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
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
  hint: { marginTop: 12, fontFamily: fonts.sans, fontSize: 12, color: colors.inkGhost },
});
