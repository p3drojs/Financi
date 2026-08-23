import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccounts, useCreateGoal } from '@/api/queries';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { DateField } from '@/components/DateField';
import { Screen } from '@/components/Screen';
import { InlineError } from '@/components/States';
import { TextField } from '@/components/TextField';
import { accountTone } from '@/lib/account';
import { parseAmount } from '@/lib/money';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

function inAYear(): string {
  const date = new Date();
  return new Date(
    Date.UTC(date.getUTCFullYear() + 1, date.getUTCMonth(), date.getUTCDate()),
  ).toISOString();
}

export default function NewGoalScreen() {
  const router = useRouter();
  const create = useCreateGoal();
  const accountsQuery = useAccounts();
  const accounts = accountsQuery.data ?? [];

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [withDate, setWithDate] = useState(false);
  const [targetDate, setTargetDate] = useState(inAYear());
  const [accountId, setAccountId] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();
  const [targetError, setTargetError] = useState<string | undefined>();

  const submit = () => {
    const trimmed = name.trim();
    const amount = parseAmount(target);

    setNameError(trimmed ? undefined : 'a meta precisa de um nome');
    setTargetError(amount ? undefined : 'quanto você quer juntar?');

    if (!trimmed || !amount) return;

    create.mutate(
      {
        name: trimmed,
        targetAmount: amount,
        targetDate: withDate ? targetDate : undefined,
        accountId,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="nova meta" />

      <View style={styles.field}>
        <TextField
          label="o que você quer"
          value={name}
          onChangeText={setName}
          placeholder="Notebook novo, viagem, reserva"
          error={nameError}
        />
      </View>

      <View style={styles.field}>
        <TextField
          label="quanto custa"
          value={target}
          onChangeText={setTarget}
          placeholder="0,00"
          keyboardType="decimal-pad"
          error={targetError}
          inputStyle={styles.amountInput}
        />
      </View>

      <View style={styles.field}>
        <Pressable style={styles.toggle} onPress={() => setWithDate(!withDate)}>
          <View style={[styles.box, withDate ? styles.boxOn : null]} />
          <Text style={styles.toggleLabel}>tenho uma data em mente</Text>
        </Pressable>
        {withDate ? (
          <View style={styles.nested}>
            <DateField label="para quando" value={targetDate} onChange={setTargetDate} />
          </View>
        ) : (
          <Text style={[type.caption, styles.hint]}>
            sem data, o app não cobra ritmo — só acompanha o quanto já juntou
          </Text>
        )}
      </View>

      {accounts.length > 0 ? (
        <View style={styles.field}>
          <Text style={type.label}>onde esse dinheiro vai ficar</Text>
          <View style={styles.accounts}>
            {accounts.map((account) => (
              <Pressable
                key={account.id}
                onPress={() => setAccountId(accountId === account.id ? undefined : account.id)}
                style={[styles.account, accountId === account.id ? styles.accountOn : null]}
              >
                <View style={[styles.mark, { backgroundColor: accountTone(account.color) }]} />
                <Text
                  style={[
                    styles.accountLabel,
                    accountId === account.id ? styles.accountLabelOn : null,
                  ]}
                >
                  {account.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[type.caption, styles.hint]}>
            {accountId
              ? 'com conta ligada, guardar move dinheiro de verdade'
              : 'sem conta, guardar é só anotação'}
          </Text>
        </View>
      ) : null}

      <View style={styles.error}>
        <InlineError error={create.error} />
      </View>

      <View style={styles.spacer} />

      <Actions primaryLabel="criar meta" onPrimary={submit} busy={create.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  field: { marginTop: 26, gap: 6 },
  amountInput: {
    fontFamily: fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    ...tabular,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: space.touch },
  box: {
    width: 15,
    height: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  boxOn: { backgroundColor: colors.sage, borderColor: colors.sage },
  toggleLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  nested: { marginTop: 8 },
  hint: { marginTop: 4 },
  accounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  account: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountOn: { borderColor: colors.sageRule },
  mark: { width: 3, height: 14, borderRadius: 2 },
  accountLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  accountLabelOn: { color: colors.sage },
  error: { marginTop: 20, minHeight: space.touch },
  spacer: { flexGrow: 1, minHeight: 20 },
});
