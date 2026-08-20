import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Stroke } from '@/components/Stroke';
import { WavyRule } from '@/components/WavyRule';
import { ChevronDown, ChevronLeft, StepMinus, StepPlus } from '@/components/icons';
import { fullDate, money } from '@/lib/format';
import { addMonths, splitInstallments } from '@/lib/installments';
import { categoryById, installmentDraft } from '@/mock/data';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

const MIN_INSTALLMENTS = 2;
const MAX_INSTALLMENTS = 60;

export default function NewInstallmentScreen() {
  const router = useRouter();
  const [count, setCount] = useState(installmentDraft.installmentTotal);

  const category = categoryById(installmentDraft.categoryId);
  const color = onPaper(category.color);
  const split = splitInstallments(installmentDraft.amount, count);
  const lastDate = addMonths(installmentDraft.startDate, count - 1);

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ChevronLeft />
        </Pressable>
        <Text style={type.title}>parcelar uma compra</Text>
      </View>

      <View style={styles.fields}>
        <Field label="o que foi">
          <Text style={type.field}>{installmentDraft.description}</Text>
        </Field>

        <Field label="quanto, no total">
          <View style={styles.amountRow}>
            <Text style={styles.currency}>R$</Text>
            <Text style={styles.amount}>{money(installmentDraft.amount)}</Text>
          </View>
        </Field>

        <Field
          label="em que categoria"
          hint={
            category.type === 'EXPENSE'
              ? 'categoria de saída, então isto entra como saída'
              : 'categoria de entrada, então isto entra como entrada'
          }
        >
          <View style={styles.categoryRow}>
            <View style={styles.categoryName}>
              <Stroke color={color} width={20} />
              <Text style={type.field}>{category.name}</Text>
            </View>
            <ChevronDown size={9} />
          </View>
        </Field>

        <View style={styles.splitRow}>
          <View style={styles.splitDate}>
            <Field label="primeira parcela">
              <Text style={[type.field, tabular]}>{fullDate(installmentDraft.startDate)}</Text>
            </Field>
          </View>

          <View style={styles.stepperBlock}>
            <Text style={type.label}>em quantas vezes</Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepButton}
                onPress={() => setCount((value) => Math.max(MIN_INSTALLMENTS, value - 1))}
              >
                <StepMinus color={count > MIN_INSTALLMENTS ? colors.inkMuted : colors.rule} />
              </Pressable>
              <Text style={styles.stepValue}>{count}</Text>
              <Pressable
                style={styles.stepButton}
                onPress={() => setCount((value) => Math.min(MAX_INSTALLMENTS, value + 1))}
              >
                <StepPlus color={count < MAX_INSTALLMENTS ? colors.inkMuted : colors.rule} />
              </Pressable>
            </View>
          </View>
        </View>

        <Field label="etiquetas">
          <View style={styles.tags}>
            {installmentDraft.tagNames.map((name) => (
              <Text key={name} style={type.field}>
                {name}
              </Text>
            ))}
            <Text style={styles.tagPlaceholder}>escrever outra</Text>
          </View>
        </Field>
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
          {remainderNote(split.remainderCents)} — de {fullDate(installmentDraft.startDate)} a{' '}
          {fullDate(lastDate)}
        </Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <Pressable style={styles.submit}>
          <Text style={styles.submitLabel}>lançar as {count}</Text>
        </Pressable>
        <Pressable style={styles.discard} onPress={() => router.back()}>
          <Text style={styles.discardLabel}>descartar</Text>
        </Pressable>
      </View>
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
  header: { height: 30, flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -14 },
  back: {
    width: space.touch,
    height: space.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: { marginTop: 28, gap: 24 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  currency: { fontFamily: fonts.serif, fontSize: 16, color: colors.inkFaint },
  amount: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.7,
    color: colors.ink,
    ...tabular,
  },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryName: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  tags: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  tagPlaceholder: { fontFamily: fonts.sans, fontSize: 17, color: colors.inkGhost },
  divider: { marginTop: 30 },
  preview: { marginTop: 20, gap: 11 },
  previewRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  previewText: { fontFamily: fonts.serif, fontSize: 24, color: colors.inkMuted },
  previewTextStrong: { fontFamily: fonts.serifItalic, color: colors.ink },
  previewValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.inkMuted, ...tabular },
  previewValueStrong: { color: colors.ink },
  previewNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint, marginTop: 2 },
  spacer: { flexGrow: 1, minHeight: 30 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  submit: {
    flexGrow: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  discard: { height: 52, paddingHorizontal: 8, justifyContent: 'center' },
  discardLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkFaint },
});
