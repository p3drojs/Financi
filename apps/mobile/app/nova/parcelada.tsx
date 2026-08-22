import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCategories, useCreateInstallments } from '@/api/queries';
import { TransactionType } from '@/api/types';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { CategoryField } from '@/components/CategoryField';
import { DateField } from '@/components/DateField';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { InlineError } from '@/components/States';
import { TagsField } from '@/components/TagsField';
import { TextField } from '@/components/TextField';
import { WavyRule } from '@/components/WavyRule';
import { StepMinus, StepPlus } from '@/components/icons';
import { fullDate, money } from '@/lib/format';
import { addMonths, splitInstallments } from '@/lib/installments';
import { parseAmount } from '@/lib/money';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

const MIN_INSTALLMENTS = 2;
const MAX_INSTALLMENTS = 60;

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'saiu' },
  { value: 'INCOME', label: 'entrou' },
];

function today(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString();
}

export default function NewInstallmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    amount?: string;
    description?: string;
    date?: string;
    categoryId?: string;
    tags?: string;
  }>();

  const [kind, setKind] = useState<TransactionType>(
    params.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
  );
  const [amount, setAmount] = useState(params.amount ?? '');
  const [description, setDescription] = useState(params.description ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(params.categoryId ?? null);
  const [startDate, setStartDate] = useState(params.date ?? today());
  const [count, setCount] = useState(6);
  const [tagNames, setTagNames] = useState<string[]>(
    params.tags ? params.tags.split(',').filter(Boolean) : [],
  );

  const categories = useCategories(kind);
  const create = useCreateInstallments();

  const parsed = parseAmount(amount);
  const split = splitInstallments(parsed ?? 0, count);
  const lastDate = addMonths(startDate, count - 1);
  const ready = parsed !== null && categoryId !== null;

  const onKindChange = (next: TransactionType) => {
    setKind(next);
    setCategoryId(null);
  };

  const submit = () => {
    if (!ready) return;

    create.mutate(
      {
        categoryId: categoryId as string,
        type: kind,
        amount: parsed as number,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(tagNames.length > 0 ? { tagNames } : {}),
        startDate,
        installmentTotal: count,
      },
      { onSuccess: () => router.dismissAll() },
    );
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="parcelar uma compra" />

      <View style={styles.kind}>
        <Segmented options={TYPE_OPTIONS} value={kind} onChange={onKindChange} />
      </View>

      <View style={styles.fields}>
        <TextField
          label="o que foi"
          value={description}
          onChangeText={setDescription}
          placeholder="Notebook Dell Inspiron 14"
        />

        <TextField
          label="quanto, no total"
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          keyboardType="decimal-pad"
          inputStyle={styles.amountInput}
          hint={amount.length > 0 && parsed === null ? 'um valor maior que zero' : undefined}
        />

        <CategoryField
          categories={categories.data ?? []}
          value={categoryId}
          onChange={setCategoryId}
          hint={
            kind === 'EXPENSE'
              ? 'categoria de saída, então isto entra como saída'
              : 'categoria de entrada, então isto entra como entrada'
          }
        />

        <View style={styles.splitRow}>
          <View style={styles.splitDate}>
            <DateField label="primeira parcela" value={startDate} onChange={setStartDate} />
          </View>

          <View style={styles.stepperBlock}>
            <Text style={type.label}>em quantas vezes</Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepButton}
                onPress={() => setCount(Math.max(MIN_INSTALLMENTS, count - 1))}
              >
                <StepMinus color={count > MIN_INSTALLMENTS ? colors.inkMuted : colors.rule} />
              </Pressable>
              <Text style={styles.stepValue}>{count}</Text>
              <Pressable
                style={styles.stepButton}
                onPress={() => setCount(Math.min(MAX_INSTALLMENTS, count + 1))}
              >
                <StepPlus color={count < MAX_INSTALLMENTS ? colors.inkMuted : colors.rule} />
              </Pressable>
            </View>
          </View>
        </View>

        <TagsField value={tagNames} onChange={setTagNames} />
      </View>

      <View style={styles.divider}>
        <WavyRule />
      </View>

      <View style={styles.preview}>
        <Text style={type.label}>vai virar</Text>

        {split.remainderCents > 0 ? (
          <>
            <View style={styles.previewRow}>
              <Text style={styles.previewText}>{split.regularCount} parcelas de</Text>
              <Text style={styles.previewValue}>{money(split.regularAmount)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={[styles.previewText, styles.previewTextStrong]}>e a última de</Text>
              <Text style={[styles.previewValue, styles.previewValueStrong]}>
                {money(split.lastAmount)}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.previewRow}>
            <Text style={[styles.previewText, styles.previewTextStrong]}>{count} parcelas de</Text>
            <Text style={[styles.previewValue, styles.previewValueStrong]}>
              {money(split.regularAmount)}
            </Text>
          </View>
        )}

        <Text style={styles.previewNote}>
          {remainderNote(split.remainderCents)} — de {fullDate(startDate)} a {fullDate(lastDate)}
        </Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.errorSlot}>
        <InlineError error={create.error} />
      </View>

      <Actions
        primaryLabel={`lançar as ${count}`}
        onPrimary={submit}
        busy={create.isPending}
        disabled={!ready}
        secondaryLabel="descartar"
        onSecondary={() => router.back()}
      />
    </Screen>
  );
}

function remainderNote(cents: number): string {
  if (cents === 0) return 'a divisão fecha exata';
  if (cents === 1) return 'o centavo que sobra da divisão cai na última';
  return `os ${cents} centavos que sobram da divisão caem na última`;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  kind: { marginTop: 14 },
  fields: { marginTop: 24, gap: 24 },
  amountInput: { fontFamily: fonts.serif, fontSize: 34, ...tabular },
  splitRow: { flexDirection: 'row', gap: 20, alignItems: 'flex-end' },
  splitDate: { flexGrow: 1 },
  stepperBlock: { gap: 6 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingBottom: 2,
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
    minWidth: 30,
    textAlign: 'center',
    ...tabular,
  },
  divider: { marginTop: 30 },
  preview: { marginTop: 20, gap: 11 },
  previewRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  previewText: { fontFamily: fonts.serif, fontSize: 24, color: colors.inkMuted },
  previewTextStrong: { fontFamily: fonts.serifItalic, color: colors.ink },
  previewValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.inkMuted, ...tabular },
  previewValueStrong: { color: colors.ink },
  previewNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint, marginTop: 2 },
  spacer: { flexGrow: 1, minHeight: 30 },
  errorSlot: { marginBottom: 12 },
});
