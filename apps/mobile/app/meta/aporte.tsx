import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { Field } from '@/components/Field';
import { MockupNote } from '@/components/Mockup';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { ChevronDown } from '@/components/icons';
import { money } from '@/lib/format';
import { accountById, goalById } from '@/lib/mockup';
import { colors, fonts, tabular, type } from '@/theme/tokens';

export default function ContributionScreen() {
  const router = useRouter();
  const [fromAccount, setFromAccount] = useState(true);
  const goal = goalById('notebook');
  const source = accountById('nubank');
  const vault = accountById('reserva');
  const amount = goal.requiredMonthly ?? 0;

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="guardar um pouco" />
      <Text style={styles.subtitle}>{`para ${goal.name.toLowerCase()}`}</Text>

      <View style={styles.mockup}>
        <MockupNote />
      </View>

      <View style={styles.amountField}>
        <Text style={type.label}>quanto</Text>
        <View style={styles.amountLine}>
          <Text style={styles.currency}>R$</Text>
          <Money style={styles.amount}>{money(amount)}</Money>
        </View>
        <Text style={[type.caption, styles.hint]}>
          {goal.targetLabel
            ? `o quanto falta por mês para chegar em ${goal.targetLabel}`
            : 'sem data marcada, você escolhe o passo'}
        </Text>
      </View>

      <View style={styles.field}>
        <Field label="quando">
          <View style={styles.picker}>
            <Money style={styles.value}>23/08/2026</Money>
            <ChevronDown />
          </View>
        </Field>
      </View>

      <Text style={styles.question}>o dinheiro sai de algum lugar?</Text>

      <View style={styles.options}>
        <Pressable
          onPress={() => setFromAccount(true)}
          style={[styles.option, fromAccount ? styles.optionPicked : null]}
        >
          <View style={[styles.radio, fromAccount ? styles.radioPicked : null]}>
            {fromAccount ? <View style={styles.radioDot} /> : null}
          </View>
          <View style={styles.optionBody}>
            <Text style={[styles.optionTitle, fromAccount ? null : styles.optionTitleOff]}>
              {`sai do ${source.name}`}
            </Text>
            <Text style={styles.optionNote}>
              O dinheiro se move de verdade: sai da conta corrente e entra na {vault.name}. Aparece
              no extrato como transferência, e nenhum dos dois lados vira despesa.
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setFromAccount(false)}
          style={[styles.option, fromAccount ? null : styles.optionPicked]}
        >
          <View style={[styles.radio, fromAccount ? null : styles.radioPicked]}>
            {fromAccount ? null : <View style={styles.radioDot} />}
          </View>
          <View style={styles.optionBody}>
            <Text style={[styles.optionTitle, fromAccount ? styles.optionTitleOff : null]}>
              só anotar
            </Text>
            <Text style={styles.optionNote}>
              Nenhuma conta se mexe. Serve para dinheiro que mora fora do app — o cofre da vó, o CDB
              que você não acompanha aqui.
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.result}>
        <Text style={styles.resultLabel}>
          {fromAccount ? `a ${vault.name} fica com` : 'a meta fica com'}
        </Text>
        <Money style={styles.resultValue}>
          {money(fromAccount ? vault.balance + amount : goal.saved + amount)}
        </Money>
      </View>

      <View style={styles.spacer} />

      <Actions primaryLabel="guardar" onPrimary={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  subtitle: { marginTop: 10, marginLeft: 30, fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  mockup: { marginTop: 14 },
  amountField: { marginTop: 24, gap: 6 },
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
  value: { fontFamily: fonts.sans, fontSize: 17, color: colors.ink },
  question: { marginTop: 30, fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  options: { marginTop: 14, gap: 12 },
  option: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.ruleFaint,
  },
  optionPicked: { borderColor: colors.sageRule },
  radio: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.rule,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioPicked: { borderColor: colors.sage },
  radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.sage },
  optionBody: { flexGrow: 1, flexShrink: 1, gap: 7 },
  optionTitle: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  optionTitleOff: { color: colors.inkMuted },
  optionNote: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 19, color: colors.inkFaint },
  result: {
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.ruleHair,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  resultLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  resultValue: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink, ...tabular },
  spacer: { flexGrow: 1, minHeight: 24 },
});
