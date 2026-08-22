import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCategories, useCreateRecurring, useCreateTransaction } from '@/api/queries';
import { TransactionType } from '@/api/types';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { DateField } from '@/components/DateField';
import { Field } from '@/components/Field';
import { PickerSheet } from '@/components/PickerSheet';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { InlineError, Loading } from '@/components/States';
import { Stroke } from '@/components/Stroke';
import { TagsField } from '@/components/TagsField';
import { TextField } from '@/components/TextField';
import { WavyRule } from '@/components/WavyRule';
import { ChevronDown, StepMinus, StepPlus } from '@/components/icons';
import { intervalLabel, monthYear } from '@/lib/format';
import { parseAmount } from '@/lib/money';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

const BATCH_WINDOW_MONTHS = 12;
const MAX_INTERVAL = 60;
const MAX_OCCURRENCES = 600;

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

const ENDING_LABELS: Record<Ending, string> = {
  open: 'sem fim',
  date: 'até uma data',
  count: 'um número de vezes',
};

function today(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString();
}

function shiftIso(iso: string, months: number): string {
  const source = new Date(iso);
  return new Date(
    Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + months, source.getUTCDate()),
  ).toISOString();
}

export default function NewTransactionScreen() {
  const router = useRouter();
  const [start] = useState(today);

  const [kind, setKind] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(start);
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [repeat, setRepeat] = useState<Repeat>('once');
  const [intervalMonths, setIntervalMonths] = useState(1);
  const [ending, setEnding] = useState<Ending>('open');
  const [endDate, setEndDate] = useState(() => shiftIso(start, BATCH_WINDOW_MONTHS));
  const [occurrences, setOccurrences] = useState(12);
  const [endingOpen, setEndingOpen] = useState(false);

  const categories = useCategories(kind);
  const createOnce = useCreateTransaction();
  const createRecurring = useCreateRecurring();

  const available = categories.data ?? [];
  const parsed = parseAmount(amount);
  const busy = createOnce.isPending || createRecurring.isPending;
  const failure = createOnce.error ?? createRecurring.error;
  const ready = parsed !== null && categoryId !== null;

  const onKindChange = (next: TransactionType) => {
    setKind(next);
    setCategoryId(null);
  };

  const onRepeatChange = (next: Repeat) => {
    if (next === 'split') {
      router.push({
        pathname: '/nova/parcelada',
        params: {
          type: kind,
          amount,
          description,
          date,
          ...(categoryId ? { categoryId } : {}),
          ...(tagNames.length > 0 ? { tags: tagNames.join(',') } : {}),
        },
      });
      return;
    }

    setRepeat(next);
  };

  const submit = () => {
    if (!ready) return;

    const base = {
      categoryId: categoryId as string,
      type: kind,
      amount: parsed as number,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(tagNames.length > 0 ? { tagNames } : {}),
    };

    const done = { onSuccess: () => router.back() };

    if (repeat === 'repeat') {
      createRecurring.mutate(
        {
          ...base,
          startDate: date,
          intervalMonths,
          ...(ending === 'date' ? { endDate } : {}),
          ...(ending === 'count' ? { occurrences } : {}),
        },
        done,
      );
      return;
    }

    createOnce.mutate({ ...base, date }, done);
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
          hint={amount.length > 0 && parsed === null ? 'um valor maior que zero' : undefined}
        />

        <TextField
          label="o que foi"
          value={description}
          onChangeText={setDescription}
          placeholder="Mercado Zona Sul"
        />

        <View style={styles.categoryBlock}>
          <Text style={type.label}>em que categoria</Text>
          {categories.isPending ? (
            <Loading label="lendo as categorias" />
          ) : (
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
          )}
          {categoryId ? null : (
            <Text style={type.caption}>
              o tipo do lançamento vem da categoria — só aparecem as de{' '}
              {kind === 'EXPENSE' ? 'saída' : 'entrada'}
            </Text>
          )}
        </View>

        <DateField label="quando" value={date} onChange={setDate} />

        <TagsField
          value={tagNames}
          onChange={setTagNames}
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
            <Stepper
              label="a cada quantos meses"
              value={intervalMonths}
              min={1}
              max={MAX_INTERVAL}
              onChange={setIntervalMonths}
              caption={intervalLabel(intervalMonths)}
            />

            <Field label="até quando">
              <Pressable style={styles.pickerRow} onPress={() => setEndingOpen(true)}>
                <Text style={type.field}>{ENDING_LABELS[ending]}</Text>
                <ChevronDown size={9} />
              </Pressable>
            </Field>

            {ending === 'count' ? (
              <Stepper
                label="quantas vezes"
                value={occurrences}
                min={1}
                max={MAX_OCCURRENCES}
                onChange={setOccurrences}
              />
            ) : null}

            {ending === 'date' ? (
              <DateField label="a última em" value={endDate} onChange={setEndDate} />
            ) : null}

            <Text style={styles.batchNote}>
              as ocorrências são geradas em lote na hora, até{' '}
              {monthYear(shiftIso(start, BATCH_WINDOW_MONTHS))}. as seguintes entram sozinhas
              conforme o tempo passa.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.spacer} />

      <View style={styles.errorSlot}>
        <InlineError error={failure} />
      </View>

      <Actions
        primaryLabel="lançar"
        onPrimary={submit}
        busy={busy}
        disabled={!ready}
        secondaryLabel="descartar"
        onSecondary={() => router.back()}
      />

      <PickerSheet
        visible={endingOpen}
        title="até quando"
        options={[
          { value: 'open' as Ending, label: ENDING_LABELS.open },
          { value: 'date' as Ending, label: ENDING_LABELS.date },
          { value: 'count' as Ending, label: ENDING_LABELS.count },
        ]}
        value={ending}
        onSelect={setEnding}
        onClose={() => setEndingOpen(false)}
      />
    </Screen>
  );
}

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  caption?: string;
}

function Stepper({ label, value, min, max, onChange, caption }: StepperProps) {
  return (
    <View style={styles.stepperBlock}>
      <Text style={type.label}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable style={styles.stepButton} onPress={() => onChange(Math.max(min, value - 1))}>
          <StepMinus color={value > min ? colors.inkMuted : colors.rule} />
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable style={styles.stepButton} onPress={() => onChange(Math.min(max, value + 1))}>
          <StepPlus color={value < max ? colors.inkMuted : colors.rule} />
        </Pressable>
      </View>
      {caption ? <Text style={type.caption}>{caption}</Text> : null}
    </View>
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
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { marginTop: 30 },
  repeatBlock: { marginTop: 20, gap: 8 },
  repeatDetail: { marginTop: 14, gap: 24 },
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
  batchNote: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 23,
    color: colors.inkMuted,
  },
  spacer: { flexGrow: 1, minHeight: 30 },
  errorSlot: { marginBottom: 12 },
});
