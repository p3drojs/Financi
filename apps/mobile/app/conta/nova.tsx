import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCreateAccount } from '@/api/queries';
import { AccountKind } from '@/api/types';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { Screen } from '@/components/Screen';
import { InlineError } from '@/components/States';
import { TextField } from '@/components/TextField';
import { ACCOUNT_KINDS, kindLabel } from '@/lib/account';
import { parseAmount } from '@/lib/money';
import { colors, fonts, space, type } from '@/theme/tokens';

export default function NewAccountScreen() {
  const router = useRouter();
  const create = useCreateAccount();

  const [name, setName] = useState('');
  const [kind, setKind] = useState<AccountKind>('CHECKING');
  const [initialBalance, setInitialBalance] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();

  const submit = () => {
    const trimmed = name.trim();

    if (!trimmed) {
      setNameError('a conta precisa de um nome');
      return;
    }

    setNameError(undefined);
    create.mutate(
      {
        name: trimmed,
        kind,
        initialBalance: parseAmount(initialBalance) ?? undefined,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="nova conta" />

      <View style={styles.field}>
        <TextField
          label="como você chama ela"
          value={name}
          onChangeText={setName}
          placeholder="Nubank, Carteira, Reserva"
          error={nameError}
        />
      </View>

      <View style={styles.field}>
        <Text style={type.label}>que tipo de conta é</Text>
        <View style={styles.kinds}>
          {ACCOUNT_KINDS.map((option) => (
            <Pressable
              key={option}
              onPress={() => setKind(option)}
              style={[styles.kind, option === kind ? styles.kindActive : null]}
            >
              <Text style={[styles.kindLabel, option === kind ? styles.kindLabelActive : null]}>
                {kindLabel(option)}
              </Text>
            </Pressable>
          ))}
        </View>
        {kind === 'CREDIT_CARD' ? (
          <Text style={[type.caption, styles.hint]}>
            cartão não tem fatura aqui — ele vive negativo, e pagar é mover dinheiro para ele
          </Text>
        ) : null}
      </View>

      <View style={styles.field}>
        <TextField
          label="quanto já tem nela"
          value={initialBalance}
          onChangeText={setInitialBalance}
          placeholder="0,00"
          keyboardType="decimal-pad"
          hint="pode deixar em branco e começar do zero"
        />
      </View>

      <View style={styles.error}>
        <InlineError error={create.error} />
      </View>

      <View style={styles.spacer} />

      <Actions primaryLabel="criar conta" onPrimary={submit} busy={create.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  field: { marginTop: 26, gap: 6 },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  kind: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    justifyContent: 'center',
  },
  kindActive: { borderColor: colors.sageRule },
  kindLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  kindLabelActive: { color: colors.sage },
  hint: { marginTop: 6 },
  error: { marginTop: 20, minHeight: space.touch },
  spacer: { flexGrow: 1, minHeight: 20 },
});
