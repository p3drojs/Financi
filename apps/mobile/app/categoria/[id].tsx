import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/api/queries';
import { TransactionType } from '@/api/types';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { InlineError, Loading } from '@/components/States';
import { Stroke } from '@/components/Stroke';
import { TextField } from '@/components/TextField';
import { onPaper } from '@/theme/categoryColors';
import { CATEGORY_PALETTE } from '@/theme/palette';
import { colors, fonts, type } from '@/theme/tokens';

const NEW = 'nova';
const FALLBACK_COLOR = CATEGORY_PALETTE[0] ?? '#616161';

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'o que sai' },
  { value: 'INCOME', label: 'o que entra' },
];

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const creating = id === NEW;

  const query = useCategories();
  const existing = creating ? undefined : query.data?.find((item) => item.id === id);

  if (!creating && query.isPending) {
    return (
      <Screen scroll>
        <BackHeader title="categoria" compact />
        <Loading label="lendo a categoria" />
      </Screen>
    );
  }

  if (!creating && !existing) {
    return (
      <Screen scroll>
        <BackHeader title="categoria" compact />
        <Text style={styles.missing}>essa categoria não está mais aqui.</Text>
      </Screen>
    );
  }

  return (
    <CategoryForm
      key={existing?.id ?? NEW}
      categoryId={existing?.id ?? null}
      initialName={existing?.name ?? ''}
      initialColor={existing?.color ?? FALLBACK_COLOR}
      initialType={existing?.type ?? 'EXPENSE'}
      onDone={() => router.back()}
    />
  );
}

interface CategoryFormProps {
  categoryId: string | null;
  initialName: string;
  initialColor: string;
  initialType: TransactionType;
  onDone: () => void;
}

function CategoryForm({
  categoryId,
  initialName,
  initialColor,
  initialType,
  onDone,
}: CategoryFormProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [kind, setKind] = useState<TransactionType>(initialType);

  const create = useCreateCategory();
  const update = useUpdateCategory(categoryId ?? '');
  const remove = useDeleteCategory();

  const editing = categoryId !== null;
  const busy = create.isPending || update.isPending || remove.isPending;
  const failure = create.error ?? update.error ?? remove.error;

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (editing) {
      update.mutate({ name: trimmed, color }, { onSuccess: onDone });
    } else {
      create.mutate({ name: trimmed, type: kind, color }, { onSuccess: onDone });
    }
  };

  const confirmDelete = () => {
    Alert.alert('apagar categoria', `"${initialName}" some da lista.`, [
      { text: 'deixar como está', style: 'cancel' },
      {
        text: 'apagar',
        style: 'destructive',
        onPress: () => remove.mutate(categoryId as string, { onSuccess: onDone }),
      },
    ]);
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title={editing ? initialName : 'categoria nova'} compact />

      <View style={styles.fields}>
        <TextField
          label="como se chama"
          value={name}
          onChangeText={setName}
          placeholder="Assinaturas"
          autoCapitalize="sentences"
        />

        {editing ? (
          <Field label="de que tipo">
            <Text style={type.field}>{kind === 'INCOME' ? 'o que entra' : 'o que sai'}</Text>
          </Field>
        ) : (
          <View style={styles.typeBlock}>
            <Text style={type.label}>de que tipo</Text>
            <Segmented options={TYPE_OPTIONS} value={kind} onChange={setKind} />
            <Text style={type.caption}>isto não muda depois de criada</Text>
          </View>
        )}

        <View style={styles.colorBlock}>
          <Text style={type.label}>a cor do traço</Text>
          <View style={styles.swatches}>
            {CATEGORY_PALETTE.map((option) => (
              <Pressable
                key={option}
                onPress={() => setColor(option)}
                style={[styles.swatch, option === color ? styles.swatchActive : null]}
              >
                <Stroke color={onPaper(option)} width={40} />
              </Pressable>
            ))}
          </View>
          <Text style={type.caption}>
            guardamos o hex escuro; no papel escuro ele aparece na versão clara
          </Text>
        </View>
      </View>

      <View style={styles.spacer} />

      <View style={styles.errorSlot}>
        <InlineError error={failure} />
      </View>

      {editing ? (
        <Text style={styles.warning}>
          categoria usada por lançamento ou repetição não pode ser apagada — mude os lançamentos
          de categoria antes.
        </Text>
      ) : null}

      <Actions
        primaryLabel="guardar"
        onPrimary={save}
        busy={busy}
        disabled={name.trim().length === 0}
        secondaryLabel={editing ? 'apagar' : 'descartar'}
        onSecondary={editing ? confirmDelete : onDone}
        secondaryTone={editing ? 'danger' : 'muted'}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  fields: { marginTop: 30, gap: 28 },
  typeBlock: { gap: 4 },
  colorBlock: { gap: 10 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: {
    width: 56,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  swatchActive: { borderColor: colors.rule, backgroundColor: colors.paperRaised },
  spacer: { flexGrow: 1, minHeight: 30 },
  errorSlot: { marginBottom: 12 },
  warning: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkFaint,
    marginBottom: 18,
  },
  missing: {
    marginTop: 30,
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    color: colors.inkFaint,
  },
});
