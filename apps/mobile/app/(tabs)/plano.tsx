import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useBudgets, useGoals, useRecurrences } from '@/api/queries';
import { Meter } from '@/components/Meter';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { PlusIcon } from '@/components/icons';
import { intervalLabel, money, monthName, monthYear, signedMoney } from '@/lib/format';
import { monthKey, startOfMonth } from '@/lib/month';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

const CEILING_PREVIEW = 3;

export default function PlanScreen() {
  const anchor = startOfMonth();
  const month = monthKey(anchor);

  const budgets = useBudgets(month);
  const recurrences = useRecurrences();
  const goals = useGoals();

  const envelope = budgets.data;
  const items = envelope?.items ?? [];
  const active = (recurrences.data ?? []).filter((item) => item.active).slice(0, 3);
  const goalList = goals.data ?? [];

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={type.title}>o plano</Text>
        <Text style={styles.month}>{monthYear(`${month}-01`)}</Text>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>quanto ainda dá</Text>
        {envelope && items.length > 0 ? (
          <Money style={styles.sectionValue}>
            {`${money(Number(envelope.totalBudgeted) - Number(envelope.totalCommitted))} de ${money(envelope.totalBudgeted)}`}
          </Money>
        ) : null}
      </View>

      {budgets.error ? (
        <ErrorState error={budgets.error} onRetry={() => void budgets.refetch()} />
      ) : budgets.isPending ? (
        <Loading label="somando os tetos" />
      ) : items.length === 0 ? (
        <EmptyState text={`nenhum teto para ${monthName(`${month}-01`)} ainda`} />
      ) : (
        <View style={styles.ceilings}>
          {items.slice(0, CEILING_PREVIEW).map((item) => (
            <View key={item.id} style={styles.ceiling}>
              <View style={styles.rowHead}>
                <Text style={styles.name}>{item.categoryName}</Text>
                <Money style={[styles.figure, item.status === 'OVER' ? styles.figureOver : null]}>
                  {`${money(item.committed)} de ${money(item.amount)}`}
                </Money>
              </View>
              <Meter
                color={item.status === 'OVER' ? colors.brick : onPaper(item.color)}
                spent={Number(item.spent) / Number(item.amount)}
                committed={Number(item.committed) / Number(item.amount)}
              />
            </View>
          ))}
        </View>
      )}

      <Link href="/orcamento" asChild>
        <Pressable style={styles.more}>
          <Text style={styles.moreLabel}>
            {items.length > CEILING_PREVIEW ? 'ver o mês inteiro' : 'mexer nos tetos'}
          </Text>
        </Pressable>
      </Link>

      <View style={styles.rule} />

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>o que se repete</Text>
      </View>

      {recurrences.error ? (
        <ErrorState error={recurrences.error} onRetry={() => void recurrences.refetch()} />
      ) : recurrences.isPending ? (
        <Loading label="procurando os moldes" />
      ) : active.length === 0 ? (
        <EmptyState text="nada se repete por aqui ainda" />
      ) : (
        <View style={styles.repeats}>
          {active.map((item) => (
            <View key={item.id} style={styles.repeat}>
              <View style={styles.repeatBody}>
                <Text style={styles.name}>{item.description ?? item.category.name}</Text>
                <Text style={styles.caption}>{intervalLabel(item.intervalMonths)}</Text>
              </View>
              <Money
                style={[
                  styles.amount,
                  item.type === 'INCOME' ? styles.amountIncome : styles.amountExpense,
                ]}
              >
                {signedMoney(item.amount, item.type)}
              </Money>
            </View>
          ))}
        </View>
      )}

      <Link href="/repeticoes" asChild>
        <Pressable style={styles.more}>
          <Text style={styles.moreLabel}>ver todas</Text>
        </Pressable>
      </Link>

      <View style={styles.rule} />

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>o que você junta</Text>
      </View>

      {goals.error ? (
        <ErrorState error={goals.error} onRetry={() => void goals.refetch()} />
      ) : goals.isPending ? (
        <Loading label="conferindo as metas" />
      ) : goalList.length === 0 ? (
        <EmptyState text="você ainda não está juntando nada" />
      ) : (
        <View style={styles.goals}>
          {goalList.map((goal) => (
            <Link key={goal.id} href={`/meta/${goal.id}`} asChild>
              <Pressable style={styles.goal}>
                <View style={styles.rowHead}>
                  <Text style={styles.name}>{goal.name}</Text>
                  <Money style={styles.figure}>
                    {`${money(goal.saved)} de ${money(goal.targetAmount)}`}
                  </Money>
                </View>
                <Meter
                  color={colors.sage}
                  spent={Number(goal.saved) / Number(goal.targetAmount)}
                  committed={0}
                />
                <Text style={styles.caption}>
                  {goal.achievedAt
                    ? 'chegou no alvo'
                    : goal.targetDate
                      ? `alvo em ${monthYear(goal.targetDate)}`
                      : 'sem data marcada'}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}

      <Link href="/meta/nova" asChild>
        <Pressable style={styles.newGoal}>
          <PlusIcon color={colors.sage} size={15} />
          <Text style={styles.moreLabel}>nova meta</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  month: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  sectionHead: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  sectionValue: { fontSize: 13, color: colors.inkFaint, ...tabular },
  ceilings: { marginTop: 14, gap: 14 },
  ceiling: { gap: 6 },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  name: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  figure: { fontSize: 13, color: colors.inkMuted, ...tabular },
  figureOver: { color: colors.brick },
  caption: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  more: { minHeight: space.touch, justifyContent: 'center' },
  moreLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.sage },
  rule: { height: 1, backgroundColor: colors.ruleHair },
  repeats: { marginTop: 12, gap: 13 },
  repeat: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  repeatBody: { flexGrow: 1, flexShrink: 1, gap: 3 },
  amount: { fontSize: 14, ...tabular },
  amountIncome: { color: colors.sage },
  amountExpense: { color: colors.brick },
  goals: { marginTop: 12, gap: 16 },
  goal: { gap: 7 },
  newGoal: {
    minHeight: space.touch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
