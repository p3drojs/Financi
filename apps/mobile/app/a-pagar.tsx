import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackHeader } from '@/components/BackHeader';
import { MockupNote } from '@/components/Mockup';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { Stroke } from '@/components/Stroke';
import { CheckIcon, ChevronDown } from '@/components/icons';
import { money } from '@/lib/format';
import { MockDue, OVERDUE, UPCOMING, dueTotal } from '@/lib/mockup';
import { colors, fonts, space, tabular } from '@/theme/tokens';

export default function DueScreen() {
  const [picked, setPicked] = useState<string[]>(OVERDUE.map((item) => item.id));

  const toggle = (id: string) =>
    setPicked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const all = [...OVERDUE, ...UPCOMING];
  const chosen = all.filter((item) => picked.includes(item.id));

  return (
    <Screen scroll gutter={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <BackHeader title="a pagar" />
        <Text style={styles.window}>próximos 7 dias</Text>
      </View>

      <View style={styles.gutter}>
        <View style={styles.mockup}>
          <MockupNote />
        </View>
      </View>

      <View style={styles.filters}>
        <Pressable style={styles.filter}>
          <Text style={styles.filterLabel}>tudo</Text>
        </Pressable>
        <Pressable style={styles.filter}>
          <Text style={[styles.filterLabel, styles.filterActive]}>a pagar</Text>
        </Pressable>
        <Pressable style={styles.filter}>
          <Text style={styles.filterLabel}>todas as contas</Text>
          <ChevronDown />
        </Pressable>
      </View>

      {OVERDUE.length === 0 ? (
        <View style={styles.gutter}>
          <Text style={styles.empty}>nada vencido — bom sinal</Text>
        </View>
      ) : (
        <>
          <View style={[styles.gutter, styles.sectionHead]}>
            <Text style={styles.overdueTitle}>venceu</Text>
            <Money style={styles.overdueTotal}>{`-${money(dueTotal(OVERDUE))}`}</Money>
          </View>
          <View style={styles.list}>
            {OVERDUE.map((item) => (
              <DueRow
                key={item.id}
                item={item}
                overdue
                picked={picked.includes(item.id)}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </View>
        </>
      )}

      <View style={[styles.gutter, styles.sectionHead]}>
        <Text style={styles.comingTitle}>vem aí</Text>
        <Money style={styles.comingTotal}>{`-${money(dueTotal(UPCOMING))}`}</Money>
      </View>

      <View style={styles.list}>
        {UPCOMING.map((item) => (
          <DueRow
            key={item.id}
            item={item}
            overdue={false}
            picked={picked.includes(item.id)}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </View>

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <View style={styles.footerBody}>
          <Text style={styles.footerLabel}>
            {chosen.length === 1 ? '1 escolhido' : `${chosen.length} escolhidos`}
          </Text>
          <Money style={styles.footerTotal}>{`R$ ${money(dueTotal(chosen))}`}</Money>
        </View>
        <Pressable style={[styles.pay, chosen.length === 0 ? styles.payBlocked : null]}>
          <Text style={[styles.payLabel, chosen.length === 0 ? styles.payLabelBlocked : null]}>
            marcar como pago
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

interface DueRowProps {
  item: MockDue;
  overdue: boolean;
  picked: boolean;
  onToggle: () => void;
}

function DueRow({ item, overdue, picked, onToggle }: DueRowProps) {
  return (
    <Pressable onPress={onToggle} style={[styles.row, overdue ? null : styles.rowPending]}>
      <View style={styles.check}>
        <View style={[styles.dot, picked ? styles.dotPicked : null]}>
          {picked ? <CheckIcon /> : null}
        </View>
      </View>

      <View style={styles.dateColumn}>
        <Money style={[styles.date, overdue ? styles.dateOverdue : null]}>{item.date}</Money>
        {item.installment ? <Money style={styles.installment}>{item.installment}</Money> : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.meta}>
          <Stroke color={item.color} width={14} thickness={2.4} />
          <Text style={styles.caption}>{item.category}</Text>
          <Text style={[styles.caption, overdue ? styles.captionOverdue : null]}>{item.note}</Text>
        </View>
      </View>

      <Money style={styles.amount}>{`-${money(item.amount)}`}</Money>
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
  mockup: { marginTop: 14 },
  filters: {
    marginTop: 4,
    paddingHorizontal: space.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  filter: { minHeight: space.touch, flexDirection: 'row', alignItems: 'center', gap: 5 },
  filterLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  filterActive: {
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingBottom: 2,
  },
  sectionHead: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  overdueTitle: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.brick },
  overdueTotal: { fontSize: 13, color: colors.brick, ...tabular },
  comingTitle: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.inkMuted },
  comingTotal: { fontSize: 13, color: colors.inkFaint, ...tabular },
  empty: {
    marginTop: 30,
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    color: colors.inkFaint,
  },
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
  captionOverdue: { color: colors.brick },
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
