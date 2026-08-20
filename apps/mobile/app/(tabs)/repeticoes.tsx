import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RecurrenceListItem } from '@/api/types';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { Stroke } from '@/components/Stroke';
import { RepeatIcon } from '@/components/icons';
import { monthYear, signedMoney } from '@/lib/format';
import { batchHorizon, recurrenceLine } from '@/lib/recurrence';
import { recurrences } from '@/mock/data';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

export default function RecurrencesScreen() {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = recurrences.filter((item) => item.active);
  const horizon = batchHorizon(recurrences);

  return (
    <Screen scroll gutter={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={type.title}>repetições</Text>
        <Text style={styles.count}>{active.length} ativas</Text>
      </View>

      {horizon ? (
        <Text style={styles.horizon}>as próximas já estão geradas até {monthYear(horizon)}</Text>
      ) : null}

      <View style={styles.list}>
        {recurrences.map((item) => (
          <RecurrenceRow
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          />
        ))}
      </View>
    </Screen>
  );
}

interface RowProps {
  item: RecurrenceListItem;
  open: boolean;
  onToggle: () => void;
}

function RecurrenceRow({ item, open, onToggle }: RowProps) {
  const color = onPaper(item.category.color);
  const past = item.generatedCount - item.upcomingCount;

  return (
    <Pressable onPress={onToggle} style={[styles.card, open ? styles.cardOpen : null]}>
      <View style={styles.summary}>
        <RepeatIcon color={open ? colors.inkMuted : colors.inkFaint} />

        <View style={styles.summaryBody}>
          <Text style={styles.title}>{item.description}</Text>
          <View style={styles.meta}>
            <Stroke color={color} width={14} thickness={2.4} />
            <Text style={styles.category}>{item.category.name}</Text>
          </View>
          <Text style={[styles.schedule, open ? styles.scheduleOpen : null]}>
            {recurrenceLine(item)}
          </Text>
        </View>

        <Money style={[styles.amount, item.type === 'INCOME' ? styles.amountIncome : null]}>
          {signedMoney(item.amount, item.type)}
        </Money>
      </View>

      {open ? (
        <View style={styles.actions}>
          <Text style={styles.note}>
            parar apaga só o que ainda não chegou. as {past} que já passaram continuam no histórico.
          </Text>
          <View style={styles.buttons}>
            <Link href={`/recorrencia/${item.id}`} asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonLabel}>mudar</Text>
              </Pressable>
            </Link>
            <Pressable style={[styles.button, styles.buttonDanger]}>
              <Text style={[styles.buttonLabel, styles.buttonLabelDanger]}>parar de repetir</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </Pressable>
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
  horizon: {
    paddingHorizontal: space.gutter,
    marginTop: 8,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.inkGhost,
  },
  list: { marginTop: 26 },
  card: { paddingHorizontal: space.gutter, paddingBottom: 20 },
  cardOpen: { backgroundColor: colors.paperRaised, paddingTop: 20, paddingBottom: 24 },
  summary: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  summaryBody: { flexGrow: 1, flexShrink: 1, gap: 6 },
  title: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  category: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  schedule: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkGhost },
  scheduleOpen: { color: colors.inkFaint },
  amount: { fontSize: 15, color: colors.ink, marginTop: 1, ...tabular },
  amountIncome: { color: colors.sage },
  actions: { marginTop: 16, gap: 16, paddingLeft: 29 },
  note: { fontFamily: fonts.serifItalic, fontSize: 15, lineHeight: 23, color: colors.inkMuted },
  buttons: { flexDirection: 'row', gap: 12 },
  button: {
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.rule,
    justifyContent: 'center',
  },
  buttonDanger: { borderColor: colors.brickRule },
  buttonLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  buttonLabelDanger: { color: colors.brick },
});
