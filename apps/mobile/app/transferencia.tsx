import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { Field } from '@/components/Field';
import { MockupNote } from '@/components/Mockup';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { ChevronDown } from '@/components/icons';
import { money } from '@/lib/format';
import { accountById } from '@/lib/mockup';
import { colors, fonts, tabular, type } from '@/theme/tokens';

export default function TransferScreen() {
  const router = useRouter();
  const from = accountById('nubank');
  const to = accountById('inter');

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="mover dinheiro" />

      <View style={styles.mockup}>
        <MockupNote />
      </View>

      <View style={styles.path}>
        <View style={styles.spine}>
          <View style={styles.spineStart} />
          <View style={styles.spineLine} />
          <View style={styles.spineEnd} />
        </View>

        <View style={styles.legs}>
          <Field label="de onde sai">
            <View style={styles.account}>
              <View style={styles.accountName}>
                <View style={[styles.mark, { backgroundColor: from.color }]} />
                <Text style={styles.value}>{from.name}</Text>
              </View>
              <Money style={styles.balance}>{money(from.balance)}</Money>
            </View>
          </Field>

          <Field label="para onde vai">
            <View style={styles.account}>
              <View style={styles.accountName}>
                <View style={[styles.mark, { backgroundColor: to.color }]} />
                <Text style={styles.value}>{to.name}</Text>
              </View>
              <Money style={[styles.balance, styles.owed]}>{money(to.balance)}</Money>
            </View>
          </Field>
        </View>
      </View>

      <View style={styles.amountField}>
        <Text style={type.label}>quanto</Text>
        <View style={styles.amountLine}>
          <Text style={styles.currency}>R$</Text>
          <Money style={styles.amount}>{money(Math.abs(to.balance))}</Money>
        </View>
        <Text style={[type.caption, styles.hint]}>o suficiente para zerar o cartão</Text>
      </View>

      <View style={styles.field}>
        <Field label="quando">
          <View style={styles.picker}>
            <Money style={styles.value}>23/08/2026</Money>
            <ChevronDown />
          </View>
        </Field>
      </View>

      <View style={styles.field}>
        <Field label="uma nota, se quiser">
          <Text style={styles.placeholder}>fatura de agosto</Text>
        </Field>
      </View>

      <View style={styles.explain}>
        <Text style={styles.explainText}>
          Isto não é uma despesa. O dinheiro só muda de lugar, então não entra em "saiu", nem no
          orçamento, nem na previsão — só nos saldos das duas contas.
        </Text>
      </View>

      <Text style={styles.warn}>
        Vai aparecer no extrato como duas linhas irmãs. Para corrigir depois, apaga e refaz —
        transferência não se edita pela metade.
      </Text>

      <View style={styles.footer}>
        <Actions primaryLabel="mover" onPrimary={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  mockup: { marginTop: 14 },
  path: { marginTop: 26, flexDirection: 'row', gap: 14 },
  spine: { width: 11, alignItems: 'center', paddingTop: 26 },
  spineStart: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  spineLine: { width: 1, flexGrow: 1, backgroundColor: colors.ruleSoft },
  spineEnd: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.sage },
  legs: { flexGrow: 1, flexShrink: 1, gap: 26 },
  account: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountName: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 3, height: 18, borderRadius: 2 },
  value: { fontFamily: fonts.sans, fontSize: 17, color: colors.ink },
  balance: { fontSize: 13, color: colors.inkFaint, ...tabular },
  owed: { color: colors.brick },
  amountField: { marginTop: 26, gap: 6 },
  amountLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingBottom: 7,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
  },
  currency: { fontFamily: fonts.serif, fontSize: 16, color: colors.inkFaint },
  amount: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.7,
    color: colors.ink,
    ...tabular,
  },
  hint: { marginTop: 3 },
  field: { marginTop: 24 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  placeholder: { fontFamily: fonts.sans, fontSize: 17, color: colors.inkGhost },
  explain: {
    marginTop: 30,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.ruleHair,
  },
  explainText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 21,
    color: colors.inkMuted,
  },
  warn: {
    marginTop: 18,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 19,
    color: colors.inkFaint,
  },
  footer: { marginTop: 30 },
});
