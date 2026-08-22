import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useCategories,
  useDeleteTransaction,
  useRecurrences,
  useTransaction,
  useUpdateTransaction,
} from '@/api/queries';
import { Transaction } from '@/api/types';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { CategoryField } from '@/components/CategoryField';
import { DateField } from '@/components/DateField';
import { Screen } from '@/components/Screen';
import { ErrorState, InlineError, Loading } from '@/components/States';
import { TagsField } from '@/components/TagsField';
import { TextField } from '@/components/TextField';
import { RepeatIcon } from '@/components/icons';
import { dayOfMonth, repeatLabel } from '@/lib/format';
import { amountToInput, parseAmount } from '@/lib/money';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useTransaction(id);

  return (
    <Screen scroll contentStyle={styles.content}>
      {query.isPending ? (
        <>
          <BackHeader title="um lançamento" compact />
          <Loading label="buscando o lançamento" />
        </>
      ) : query.error ? (
        <>
          <BackHeader title="um lançamento" compact />
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </>
      ) : query.data ? (
        <TransactionForm key={query.data.id} item={query.data} />
      ) : null}
    </Screen>
  );
}

function TransactionForm({ item }: { item: Transaction }) {
  const router = useRouter();
  const categories = useCategories(item.type);
  const recurrences = useRecurrences();
  const update = useUpdateTransaction(item.id);
  const remove = useDeleteTransaction(item.id);

  const [amount, setAmount] = useState(() => amountToInput(item.amount));
  const [description, setDescription] = useState(item.description ?? '');
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [date, setDate] = useState(item.date);
  const [tagNames, setTagNames] = useState(() => item.tags.map((link) => link.tag.name));

  const day = dayOfMonth(item.date);
  const parsed = parseAmount(amount);
  const busy = update.isPending || remove.isPending;
  const failure = update.error ?? remove.error;

  const recurrence = item.recurrenceId
    ? (recurrences.data ?? []).find((entry) => entry.id === item.recurrenceId)
    : undefined;

  const save = () => {
    if (parsed === null) return;

    update.mutate(
      {
        categoryId,
        amount: parsed,
        description: description.trim(),
        date,
        tagNames,
      },
      { onSuccess: () => router.back() },
    );
  };

  const confirmDelete = () => {
    Alert.alert('apagar este lançamento', `só o de ${day} some. o resto fica.`, [
      { text: 'deixar como está', style: 'cancel' },
      {
        text: 'apagar',
        style: 'destructive',
        onPress: () => remove.mutate(undefined, { onSuccess: () => router.back() }),
      },
    ]);
  };

  return (
    <>
      <BackHeader title={day} />

      {recurrence ? (
        <ScopeNote
          text={`isto ${repeatLabel(recurrence.intervalMonths)}. o que você mudar aqui vale só para ${day}.`}
          linkLabel="mudar a repetição inteira"
          href={`/recorrencia/${recurrence.id}`}
        />
      ) : null}

      {item.installmentGroupId && item.installmentNumber && item.installmentTotal ? (
        <ScopeNote
          text={`isto é a parcela ${item.installmentNumber} de ${item.installmentTotal}. o que você mudar aqui vale só para ${day}.`}
          linkLabel="ver o parcelamento inteiro"
          href={`/parcelamento/${item.installmentGroupId}`}
        />
      ) : null}

      <View style={styles.fields}>
        <TextField
          label="o que foi"
          value={description}
          onChangeText={setDescription}
          placeholder="sem descrição"
        />

        <TextField
          label="quanto"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          inputStyle={styles.amountInput}
          hint={parsed === null ? 'um valor maior que zero' : undefined}
        />

        <CategoryField
          categories={categories.data ?? []}
          value={categoryId}
          onChange={setCategoryId}
          hint={item.type === 'INCOME' ? 'só categorias de entrada' : 'só categorias de saída'}
        />

        <DateField label="quando" value={date} onChange={setDate} />

        <TagsField value={tagNames} onChange={setTagNames} />
      </View>

      <View style={styles.spacer} />

      <View style={styles.errorSlot}>
        <InlineError error={failure} />
      </View>

      <Actions
        primaryLabel="guardar"
        onPrimary={save}
        busy={busy}
        disabled={parsed === null}
        secondaryLabel="apagar este"
        onSecondary={confirmDelete}
        secondaryTone="danger"
      />
    </>
  );
}

interface ScopeNoteProps {
  text: string;
  linkLabel: string;
  href: string;
}

function ScopeNote({ text, linkLabel, href }: ScopeNoteProps) {
  return (
    <View style={styles.note}>
      <View style={styles.noteIcon}>
        <RepeatIcon color={colors.inkMuted} />
      </View>
      <View style={styles.noteBody}>
        <Text style={type.note}>{text}</Text>
        <Link href={href} asChild>
          <Pressable style={styles.noteLink}>
            <Text style={styles.noteLinkLabel}>{linkLabel}</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  note: { marginTop: 22, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  noteIcon: { marginTop: 3 },
  noteBody: { flexGrow: 1, flexShrink: 1, gap: 8 },
  noteLink: { minHeight: space.touch, justifyContent: 'center', alignSelf: 'flex-start' },
  noteLinkLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.sage,
    borderBottomWidth: 1,
    borderBottomColor: colors.sageRule,
    paddingBottom: 2,
  },
  fields: { marginTop: 34, gap: 28 },
  amountInput: { fontFamily: fonts.serif, fontSize: 34, ...tabular },
  spacer: { flexGrow: 1, minHeight: 40 },
  errorSlot: { marginBottom: 12 },
});
