import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRecurrences } from '@/api/queries';
import { Meter } from '@/components/Meter';
import { MockupNote } from '@/components/Mockup';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { intervalLabel, money, signedMoney } from '@/lib/format';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

const CEILINGS = [
  { id: 'alimentacao', name: 'Alimentação', color: '#FF9A4D', spent: 968.4, committed: 968.4, amount: 1200 },
  { id: 'transporte', name: 'Transporte', color: '#57ACE8', spent: 312.4, committed: 440.6, amount: 600 },
  { id: 'compras', name: 'Compras', color: '#CE867E', spent: 297.5, committed: 518, amount: 400 },
];

const GOALS = [
  { id: 'notebook', name: 'Notebook novo', saved: 1150, target: 4200, pace: 'no ritmo de agora, chega em março' },
  { id: 'viagem', name: 'Viagem', saved: 300, target: 3000, pace: 'sem data marcada' },
];

const REMAINING = 1208.4;
const TOTAL_CEILING = 3400;

export default function PlanScreen() {
  const query = useRecurrences();
  const recurrences = (query.data ?? []).filter((item) => item.active).slice(0, 3);

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={type.title}>o plano</Text>
        <Text style={styles.month}>agosto de 2026</Text>
      </View>

      <View style={styles.mockup}>
        <MockupNote text="teto e metas ainda são maquete" />
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>quanto ainda dá</Text>
        <Money style={styles.sectionValue}>
          {`${money(REMAINING)} de ${money(TOTAL_CEILING)}`}
        </Money>
      </View>

      <View style={styles.ceilings}>
        {CEILINGS.map((item) => {
          const over = item.committed > item.amount;
          return (
            <View key={item.id} style={styles.ceiling}>
              <View style={styles.ceilingHead}>
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
            </View>
          );
        })}
      </View>

      <Link href="/orcamento" asChild>
        <Pressable style={styles.more}>
          <Text style={styles.moreLabel}>ver o mês inteiro</Text>
        </Pressable>
      </Link>

      <View style={styles.rule} />

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>o que se repete</Text>
      </View>

      {query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Loading label="procurando os moldes" />
      ) : recurrences.length === 0 ? (
        <EmptyState text="nada se repete por aqui ainda" />
      ) : (
        <View style={styles.repeats}>
          {recurrences.map((item) => (
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

      <View style={styles.goals}>
        {GOALS.map((goal) => (
          <Link key={goal.id} href={`/meta/${goal.id}`} asChild>
            <Pressable style={styles.goal}>
              <View style={styles.ceilingHead}>
                <Text style={styles.name}>{goal.name}</Text>
                <Money style={styles.figure}>
                  {`${money(goal.saved)} de ${money(goal.target)}`}
                </Money>
              </View>
              <Meter color={colors.sage} spent={goal.saved / goal.target} committed={0} />
              <Text style={styles.caption}>{goal.pace}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  month: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  mockup: { marginTop: 12 },
  sectionHead: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  sectionValue: { fontSize: 13, color: colors.inkFaint, ...tabular },
  ceilings: { marginTop: 14, gap: 14 },
  ceiling: { gap: 6 },
  ceilingHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
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
});
