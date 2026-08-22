import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCancelRecurrence, useRecurrences } from '@/api/queries';
import { RecurrenceListItem } from '@/api/types';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, InlineError, Loading } from '@/components/States';
import { Stroke } from '@/components/Stroke';
import { RepeatIcon } from '@/components/icons';
import { monthYear, signedMoney } from '@/lib/format';
import { batchHorizon, recurrenceLine } from '@/lib/recurrence';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

export default function RecurrencesScreen() {
  const [openId, setOpenId] = useState<string | null>(null);
  const query = useRecurrences();
  const cancel = useCancelRecurrence();

  const items = query.data ?? [];
  const active = items.filter((item) => item.active);
  const horizon = batchHorizon(items);

  const confirmCancel = (item: RecurrenceListItem) => {
    Alert.alert(
      'parar de repetir',
      `as ${item.upcomingCount} que ainda não chegaram somem. as que já passaram ficam no histórico.`,
      [
        { text: 'deixar como está', style: 'cancel' },
        {
          text: 'parar',
          style: 'destructive',
          onPress: () => {
            cancel.mutate(item.id, { onSuccess: () => setOpenId(null) });
          },
        },
      ],
    );
  };

  return (
    <Screen scroll gutter={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={type.title}>repetições</Text>
        <Text style={styles.count}>
          {query.isPending ? 'contando' : `${active.length} ativas`}
        </Text>
      </View>

      {horizon ? (
        <Text style={styles.horizon}>as próximas já estão geradas até {monthYear(horizon)}</Text>
      ) : null}

      {cancel.error ? (
        <View style={styles.gutter}>
          <InlineError error={cancel.error} />
        </View>
      ) : null}

      {query.error ? (
        <View style={styles.gutter}>
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </View>
      ) : query.isPending ? (
        <Loading label="procurando os moldes" />
      ) : items.length === 0 ? (
        <EmptyState text="nada se repete por aqui ainda" />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <RecurrenceRow
              key={item.id}
              item={item}
              open={openId === item.id}
              busy={cancel.isPending && cancel.variables === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              onCancel={() => confirmCancel(item)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

interface RowProps {
  item: RecurrenceListItem;
  open: boolean;
  busy: boolean;
  onToggle: () => void;
  onCancel: () => void;
}

function RecurrenceRow({ item, open, busy, onToggle, onCancel }: RowProps) {
  const color = onPaper(item.category.color);
  const past = item.generatedCount - item.upcomingCount;

  return (
    <Pressable onPress={onToggle} style={[styles.card, open ? styles.cardOpen : null]}>
      <View style={styles.summary}>
        <RepeatIcon color={open ? colors.inkMuted : colors.inkFaint} />

        <View style={styles.summaryBody}>
          <Text style={[styles.title, item.active ? null : styles.titleStopped]}>
            {item.description ?? item.category.name}
          </Text>
          <View style={styles.meta}>
            <Stroke color={color} width={14} thickness={2.4} />
            <Text style={styles.category}>{item.category.name}</Text>
            {item.active ? null : <Text style={styles.stopped}>parada</Text>}
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
          {item.active ? (
            <>
              <Text style={styles.note}>
                parar apaga só o que ainda não chegou. as {past} que já passaram continuam no
                histórico.
              </Text>
              <View style={styles.buttons}>
                <Link href={`/recorrencia/${item.id}`} asChild>
                  <Pressable style={styles.button}>
                    <Text style={styles.buttonLabel}>mudar</Text>
                  </Pressable>
                </Link>
                <Pressable
                  style={[styles.button, styles.buttonDanger]}
                  onPress={onCancel}
                  disabled={busy}
                >
                  <Text style={[styles.buttonLabel, styles.buttonLabelDanger]}>
                    {busy ? 'parando' : 'parar de repetir'}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.note}>
              esta repetição já foi parada. as {item.generatedCount} ocorrências que sobraram
              continuam no histórico.
            </Text>
          )}
        </View>
      ) : null}
    </Pressable>
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
  titleStopped: { color: colors.inkFaint },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  category: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  stopped: { fontFamily: fonts.sans, fontSize: 12, color: colors.brick },
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
