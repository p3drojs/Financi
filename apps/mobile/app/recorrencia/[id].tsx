import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCancelRecurrence, useCategories, useRecurrences, useUpdateRecurrence } from '@/api/queries';
import { RecurrenceListItem, UpdateRecurrenceInput } from '@/api/types';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { CategoryField } from '@/components/CategoryField';
import { DateField } from '@/components/DateField';
import { Field } from '@/components/Field';
import { PickerSheet } from '@/components/PickerSheet';
import { Screen } from '@/components/Screen';
import { ErrorState, InlineError, Loading } from '@/components/States';
import { TextField } from '@/components/TextField';
import { WavyRule } from '@/components/WavyRule';
import { ChevronDown, StepMinus, StepPlus } from '@/components/icons';
import { fullDate, intervalLabel } from '@/lib/format';
import { amountToInput, parseAmount } from '@/lib/money';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

const MAX_INTERVAL = 60;
const MAX_OCCURRENCES = 600;
const DEFAULT_OCCURRENCES = 12;
const DEFAULT_END_MONTHS = 12;

type Ending = 'open' | 'date' | 'count';

const ENDING_LABELS: Record<Ending, string> = {
  open: 'sem fim',
  date: 'até uma data',
  count: 'um número de vezes',
};

export default function EditRecurrenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useRecurrences();
  const item = (query.data ?? []).find((entry) => entry.id === id);

  return (
    <Screen scroll contentStyle={styles.content}>
      {query.isPending ? (
        <>
          <BackHeader title="a repetição" compact />
          <Loading label="lendo o molde" />
        </>
      ) : query.error ? (
        <>
          <BackHeader title="a repetição" compact />
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </>
      ) : item ? (
        <RecurrenceForm key={item.id} item={item} />
      ) : (
        <>
          <BackHeader title="a repetição" compact />
          <Text style={styles.missing}>essa repetição não está mais aqui.</Text>
        </>
      )}
    </Screen>
  );
}

function defaultEndDate(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + DEFAULT_END_MONTHS, now.getUTCDate()),
  ).toISOString();
}

function RecurrenceForm({ item }: { item: RecurrenceListItem }) {
  const router = useRouter();
  const categories = useCategories(item.type);
  const update = useUpdateRecurrence(item.id);
  const cancel = useCancelRecurrence();

  const [amount, setAmount] = useState(() => amountToInput(item.amount));
  const [description, setDescription] = useState(item.description ?? '');
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [intervalMonths, setIntervalMonths] = useState(item.intervalMonths);
  const [ending, setEnding] = useState<Ending>(
    item.endDate ? 'date' : item.occurrences ? 'count' : 'open',
  );
  const [endDate, setEndDate] = useState(item.endDate ?? defaultEndDate());
  const [occurrences, setOccurrences] = useState(item.occurrences ?? DEFAULT_OCCURRENCES);
  const [endingOpen, setEndingOpen] = useState(false);

  const parsed = parseAmount(amount);
  const past = item.generatedCount - item.upcomingCount;

  const initialEnding: Ending = item.endDate ? 'date' : item.occurrences ? 'count' : 'open';
  const scheduleChanged =
    intervalMonths !== item.intervalMonths ||
    ending !== initialEnding ||
    (ending === 'date' && endDate !== item.endDate) ||
    (ending === 'count' && occurrences !== item.occurrences);

  const busy = update.isPending || cancel.isPending;
  const failure = update.error ?? cancel.error;

  const save = () => {
    if (parsed === null) return;

    const body: UpdateRecurrenceInput = {
      categoryId,
      amount: parsed,
      description: description.trim(),
    };

    if (intervalMonths !== item.intervalMonths) {
      body.intervalMonths = intervalMonths;
    }

    if (ending !== initialEnding || (ending === 'date' && endDate !== item.endDate)) {
      body.endDate = ending === 'date' ? endDate : null;
    }

    if (ending !== initialEnding || (ending === 'count' && occurrences !== item.occurrences)) {
      body.occurrences = ending === 'count' ? occurrences : null;
    }

    update.mutate(body, { onSuccess: () => router.back() });
  };

  const confirmCancel = () => {
    Alert.alert(
      'parar de repetir',
      `as ${item.upcomingCount} que ainda não chegaram somem. as ${past} que já passaram ficam.`,
      [
        { text: 'deixar como está', style: 'cancel' },
        {
          text: 'parar',
          style: 'destructive',
          onPress: () => cancel.mutate(item.id, { onSuccess: () => router.back() }),
        },
      ],
    );
  };

  return (
    <>
      <BackHeader title={item.description ?? item.category.name} compact />

      <Text style={styles.scope}>
        isto muda o molde, não uma ocorrência só — vale para as {item.upcomingCount} que ainda não
        chegaram. as {past} que já passaram ficam como estão.
      </Text>

      <View style={styles.fields}>
        <TextField
          label="quanto"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          inputStyle={styles.amountInput}
          hint={parsed === null ? 'um valor maior que zero' : undefined}
        />

        <TextField label="o que foi" value={description} onChangeText={setDescription} />

        <CategoryField
          categories={categories.data ?? []}
          value={categoryId}
          onChange={setCategoryId}
        />

        <Field label="começou em">
          <Text style={[type.field, tabular]}>{fullDate(item.startDate)}</Text>
        </Field>

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

        {ending === 'date' ? (
          <DateField label="a última em" value={endDate} onChange={setEndDate} />
        ) : null}

        {ending === 'count' ? (
          <Stepper
            label="quantas vezes"
            value={occurrences}
            min={1}
            max={MAX_OCCURRENCES}
            onChange={setOccurrences}
          />
        ) : null}
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

      <View style={styles.errorSlot}>
        <InlineError error={failure} />
      </View>

      <Actions
        primaryLabel="guardar"
        onPrimary={save}
        busy={busy}
        disabled={parsed === null}
        secondaryLabel="parar de repetir"
        onSecondary={confirmCancel}
        secondaryTone="danger"
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
    </>
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
  scope: {
    marginTop: 20,
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkMuted,
  },
  fields: { marginTop: 30, gap: 26 },
  amountInput: { fontFamily: fonts.serif, fontSize: 34, ...tabular },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  errorSlot: { marginBottom: 12 },
  missing: {
    marginTop: 30,
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    color: colors.inkFaint,
  },
});
