import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TransactionType } from '@/api/types';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Stroke } from '@/components/Stroke';
import { TextField } from '@/components/TextField';
import { WavyRule } from '@/components/WavyRule';
import { ChevronDown, StepMinus, StepPlus } from '@/components/icons';
import { fullDate, intervalLabel, monthYear } from '@/lib/format';
import { addMonths } from '@/lib/installments';
import { categories } from '@/mock/data';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

const BATCH_WINDOW_MONTHS = 12;
const MAX_INTERVAL = 60;

type Repeat = 'once' | 'repeat' | 'split';
type Ending = 'open' | 'date' | 'count';

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'saiu' },
  { value: 'INCOME', label: 'entrou' },
];

const REPEAT_OPTIONS: { value: Repeat; label: string }[] = [
  { value: 'once', label: 'só uma vez' },
  { value: 'repeat', label: 'repetir' },
  { value: 'split', label: 'parcelar' },
];

const ENDING_OPTIONS: { value: Ending; label: string }[] = [
  { value: 'open', label: 'sem fim' },
  { value: 'date', label: 'até uma data' },
  { value: 'count', label: 'um número de vezes' },
];

export default function NewTransactionScreen() {
  const router = useRouter();
  const today = new Date().toISOString();

  const [kind, setKind] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tag, setTag] = useState('');
  const [repeat, setRepeat] = useState<Repeat>('once');
  const [intervalMonths, setIntervalMonths] = useState(1);
  const [ending, setEnding] = useState<Ending>('open');
  const [occurrences, setOccurrences] = useState(12);

  const available = categories.filter((item) => item.type === kind);
  const selected = available.find((item) => item.id === categoryId) ?? null;

  const onKindChange = (next: TransactionType) => {
    setKind(next);
    setCategoryId(null);
  };

  const onRepeatChange = (next: Repeat) => {
    if (next === 'split') {
      router.push('/nova/parcelada');
      return;
    }
    setRepeat(next);
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="um lançamento" />

      <View style={styles.kind}>
        <Segmented options={TYPE_OPTIONS} value={kind} onChange={onKindChange} />
      </View>

      <View style={styles.fields}>
        <TextField
          label="quanto"
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          keyboardType="decimal-pad"
          inputStyle={styles.amountInput}
        />

        <TextField
          label="o que foi"
          value={description}
          onChangeText={setDescription}
          placeholder="Mercado Zona Sul"
        />

        <View style={styles.categoryBlock}>
          <Text style={type.label}>em que categoria</Text>
          <View style={styles.grid}>
            {available.map((item) => {
              const active = item.id === categoryId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setCategoryId(item.id)}
                  style={[styles.chip, active ? styles.chipActive : null]}
                >
                  <Stroke color={onPaper(item.color)} width={16} thickness={2.4} />
                  <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {selected ? null : (
            <Text style={type.caption}>
              o tipo do lançamento vem da categoria — só aparecem as de {kind === 'EXPENSE' ? 'saída' : 'entrada'}
            </Text>
          )}
        </View>

        <Field label="quando">
          <View style={styles.dateRow}>
            <Text style={[type.field, tabular]}>{fullDate(today)}</Text>
            <ChevronDown size={9} />
          </View>
        </Field>

        <TextField
          label="etiquetas"
          value={tag}
          onChangeText={setTag}
          placeholder="escrever uma"
          autoCapitalize="none"
          hint="nasce na hora se ainda não existir"
        />
      </View>

      <View style={styles.divider}>
        <WavyRule />
      </View>

      <View style={styles.repeatBlock}>
        <Text style={type.label}>e depois</Text>
        <Segmented options={REPEAT_OPTIONS} value={repeat} onChange={onRepeatChange} />

        {repeat === 'repeat' ? (
          <View style={styles.repeatDetail}>
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

            <View style={styles.endingBlock}>
              <Text style={type.label}>até quando</Text>
              <Segmented options={ENDING_OPTIONS} value={ending} onChange={setEnding} />
            </View>

            {ending === 'count' ? (
              <View style={styles.stepperBlock}>
                <Text style={type.label}>quantas vezes</Text>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepButton}
                    onPress={() => setOccurrences((value) => Math.max(1, value - 1))}
                  >
                    <StepMinus color={occurrences > 1 ? colors.inkMuted : colors.rule} />
                  </Pressable>
                  <Text style={styles.stepValue}>{occurrences}</Text>
                  <Pressable
                    style={styles.stepButton}
                    onPress={() => setOccurrences((value) => Math.min(600, value + 1))}
                  >
                    <StepPlus />
                  </Pressable>
                </View>
              </View>
            ) : null}

            {ending === 'date' ? (
              <Field label="a última em">
                <View style={styles.dateRow}>
                  <Text style={[type.field, tabular]}>
                    {fullDate(addMonths(today, BATCH_WINDOW_MONTHS))}
                  </Text>
                  <ChevronDown size={9} />
                </View>
              </Field>
            ) : null}

            <Text style={styles.batchNote}>
              as ocorrências são geradas em lote na hora, até{' '}
              {monthYear(addMonths(today, BATCH_WINDOW_MONTHS))}. as seguintes entram sozinhas
              conforme o tempo passa.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.spacer} />

      <Actions
        primaryLabel="lançar"
        onPrimary={() => router.back()}
        secondaryLabel="descartar"
        onSecondary={() => router.back()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  kind: { marginTop: 14 },
  fields: { marginTop: 18, gap: 26 },
  amountInput: { fontFamily: fonts.serif, fontSize: 34, ...tabular },
  categoryBlock: { gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: space.touch,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.ruleFaint,
  },
  chipActive: { borderColor: colors.rule, backgroundColor: colors.paperRaised },
  chipLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkFaint },
  chipLabelActive: { color: colors.ink },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { marginTop: 30 },
  repeatBlock: { marginTop: 20, gap: 8 },
  repeatDetail: { marginTop: 14, gap: 24 },
  stepperBlock: { gap: 6, alignSelf: 'flex-start' },
  endingBlock: { gap: 2 },
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
  batchNote: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 23,
    color: colors.inkMuted,
  },
  spacer: { flexGrow: 1, minHeight: 30 },
});
