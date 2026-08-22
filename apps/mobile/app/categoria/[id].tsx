import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { categories, transactions } from '@/mock/data';
import { onPaper } from '@/theme/categoryColors';
import { CATEGORY_PALETTE } from '@/theme/palette';
import { colors, fonts, type } from '@/theme/tokens';

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'o que sai' },
  { value: 'INCOME', label: 'o que entra' },
];

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const existing = categories.find((item) => item.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState(existing?.color ?? CATEGORY_PALETTE[0] ?? '#616161');
  const [kind, setKind] = useState<TransactionType>(existing?.type ?? 'EXPENSE');

  const inUse = existing
    ? transactions.some((item) => item.categoryId === existing.id)
    : false;

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title={existing ? existing.name : 'categoria nova'} compact />

      <View style={styles.fields}>
        <TextField
          label="como se chama"
          value={name}
          onChangeText={setName}
          placeholder="Assinaturas"
          autoCapitalize="sentences"
        />

        {existing ? (
          <Field label="de que tipo">
            <Text style={type.field}>
              {existing.type === 'INCOME' ? 'o que entra' : 'o que sai'}
            </Text>
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

      {existing && inUse ? (
        <Text style={styles.warning}>
          esta categoria está em uso — para apagar, mude os lançamentos dela de categoria antes.
        </Text>
      ) : null}

      <Actions
        primaryLabel="guardar"
        onPrimary={() => router.back()}
        secondaryLabel={existing ? 'apagar' : 'descartar'}
        onSecondary={() => router.back()}
        secondaryTone={existing ? 'danger' : 'muted'}
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
  warning: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.brick,
    marginBottom: 18,
  },
});
