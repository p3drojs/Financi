import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Stroke } from '@/components/Stroke';
import { TextField } from '@/components/TextField';
import { WavyRule } from '@/components/WavyRule';
import { ChevronDown, StepMinus, StepPlus } from '@/components/icons';
import { fullDate, intervalLabel, money } from '@/lib/format';
import { recurrences } from '@/mock/data';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

const MAX_INTERVAL = 60;

export default function EditRecurrenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const item = recurrences.find((entry) => entry.id === id) ?? (recurrences[0] as (typeof recurrences)[number]);

  const [amount, setAmount] = useState(money(item.amount));
  const [description, setDescription] = useState(item.description ?? '');
  const [intervalMonths, setIntervalMonths] = useState(item.intervalMonths);

  const scheduleChanged = intervalMonths !== item.intervalMonths;
  const color = onPaper(item.category.color);

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title={item.description ?? 'a repetição'} compact />

      <Text style={styles.scope}>
        isto muda o molde, não uma ocorrência só — vale para as {item.upcomingCount} que ainda não
        chegaram. as {item.generatedCount - item.upcomingCount} que já passaram ficam como estão.
      </Text>

      <View style={styles.fields}>
        <TextField
          label="quanto"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          inputStyle={styles.amountInput}
        />

        <TextField label="o que foi" value={description} onChangeText={setDescription} />

        <Field label="em que categoria">
          <View style={styles.categoryRow}>
            <View style={styles.categoryName}>
              <Stroke color={color} width={20} />
              <Text style={type.field}>{item.category.name}</Text>
            </View>
            <ChevronDown size={9} />
          </View>
        </Field>

        <Field label="começou em">
          <Text style={[type.field, tabular]}>{fullDate(item.startDate)}</Text>
        </Field>

        <View style={styles.stepperBlock}>
          <Text style={type.label}>a cada quantos meses</Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepButton}
              onPress={() => setIntervalMonths((value) => Math.max(1, value - 1))}
            >
              <StepMinus color={intervalMonths > 1 ? colors.inkMuted : colors.rule} />
            </Pressable>
            <Text style={styles.stepValue}>{intervalMonths}</Text>
            <Pressable
              style={styles.stepButton}
              onPress={() => setIntervalMonths((value) => Math.min(MAX_INTERVAL, value + 1))}
            >
              <StepPlus color={intervalMonths < MAX_INTERVAL ? colors.inkMuted : colors.rule} />
            </Pressable>
          </View>
          <Text style={type.caption}>{intervalLabel(intervalMonths)}</Text>
        </View>

        <Field label="até quando">
          <View style={styles.categoryRow}>
            <Text style={[type.field, tabular]}>
              {item.endDate ? fullDate(item.endDate) : item.occurrences ? `${item.occurrences} vezes` : 'sem fim'}
            </Text>
            <ChevronDown size={9} />
          </View>
        </Field>
      </View>

      {scheduleChanged ? (
        <View style={styles.warningBlock}>
          <WavyRule />
          <Text style={styles.warning}>
            mexer no intervalo ou no fim apaga as {item.upcomingCount} ocorrências futuras e gera
            de novo. se você tinha editado alguma delas por fora, essa edição se perde.
          </Text>
        </View>
      ) : null}

      <View style={styles.spacer} />

      <Actions
        primaryLabel="guardar"
        onPrimary={() => router.back()}
        secondaryLabel="parar de repetir"
        onSecondary={() => router.back()}
        secondaryTone="danger"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  scope: {
    marginTop: 20,
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkMuted,
  },
  fields: { marginTop: 30, gap: 26 },
  amountInput: { fontFamily: fonts.serif, fontSize: 34, ...tabular },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryName: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBlock: { gap: 6, alignSelf: 'flex-start' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingBottom: 2,
    alignSelf: 'flex-start',
  },
  stepButton: {
    width: space.touch,
    height: space.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
    minWidth: 34,
    textAlign: 'center',
    ...tabular,
  },
  warningBlock: { marginTop: 28, gap: 16 },
  warning: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: colors.brick },
  spacer: { flexGrow: 1, minHeight: 30 },
});
