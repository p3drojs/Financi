import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccounts, useCreateTransfer } from '@/api/queries';
import { Account } from '@/api/types';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { DateField } from '@/components/DateField';
import { Field } from '@/components/Field';
import { Money } from '@/components/Money';
import { PickerSheet } from '@/components/PickerSheet';
import { Screen } from '@/components/Screen';
import { ErrorState, InlineError, Loading } from '@/components/States';
import { TextField } from '@/components/TextField';
import { ChevronDown } from '@/components/icons';
import { accountTone } from '@/lib/account';
import { money } from '@/lib/format';
import { parseAmount } from '@/lib/money';
import { colors, fonts, space, tabular } from '@/theme/tokens';

export default function TransferScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fromAccountId?: string; toAccountId?: string }>();
  const query = useAccounts();
  const transfer = useCreateTransfer();

  const accounts = useMemo(() => query.data ?? [], [query.data]);

  const [fromId, setFromId] = useState<string | undefined>(params.fromAccountId);
  const [toId, setToId] = useState<string | undefined>(params.toAccountId);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [description, setDescription] = useState('');
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [amountError, setAmountError] = useState<string | undefined>();

  const from = accounts.find((account) => account.id === fromId);
  const to = accounts.find((account) => account.id === toId);
  const sameAccount = Boolean(fromId && toId && fromId === toId);

  const submit = () => {
    const value = parseAmount(amount);

    if (!value) {
      setAmountError('quanto você quer mover?');
      return;
    }

    setAmountError(undefined);

    if (!fromId || !toId) return;

    transfer.mutate(
      {
        fromAccountId: fromId,
        toAccountId: toId,
        amount: value,
        date,
        description: description.trim() || undefined,
      },
      { onSuccess: () => router.back() },
    );
  };

  if (query.error) {
    return (
      <Screen>
        <BackHeader title="mover dinheiro" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  if (query.isPending) {
    return (
      <Screen>
        <BackHeader title="mover dinheiro" />
        <Loading label="procurando suas contas" />
      </Screen>
    );
  }

  if (accounts.length < 2) {
    return (
      <Screen>
        <BackHeader title="mover dinheiro" />
        <Text style={styles.needTwo}>
          Transferência precisa de duas contas. Você tem uma só — crie outra em "onde o dinheiro
          está" e volte aqui.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="mover dinheiro" />

      <View style={styles.path}>
        <View style={styles.spine}>
          <View style={styles.spineStart} />
          <View style={styles.spineLine} />
          <View style={styles.spineEnd} />
        </View>

        <View style={styles.legs}>
          <Pressable onPress={() => setPicking('from')}>
            <Field label="de onde sai">
              <AccountLine account={from} />
            </Field>
          </Pressable>

          <Pressable onPress={() => setPicking('to')}>
            <Field label="para onde vai" hint={sameAccount ? 'precisa ser outra conta' : undefined}>
              <AccountLine account={to} />
            </Field>
          </Pressable>
        </View>
      </View>

      <View style={styles.field}>
        <TextField
          label="quanto"
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          keyboardType="decimal-pad"
          error={amountError}
          inputStyle={styles.amountInput}
        />
      </View>

      <View style={styles.field}>
        <DateField label="quando" value={date} onChange={setDate} />
      </View>

      <View style={styles.field}>
        <TextField
          label="uma nota, se quiser"
          value={description}
          onChangeText={setDescription}
          placeholder="fatura de agosto"
        />
      </View>

      <View style={styles.explain}>
        <Text style={styles.explainText}>
          Isto não é uma despesa. O dinheiro só muda de lugar, então não entra em &quot;saiu&quot;,
          nem no orçamento, nem na previsão — só nos saldos das duas contas.
        </Text>
      </View>

      <Text style={styles.warn}>
        Vai aparecer no extrato como duas linhas irmãs. Para corrigir depois, apaga e refaz —
        transferência não se edita pela metade.
      </Text>

      <View style={styles.error}>
        <InlineError error={transfer.error} />
      </View>

      <View style={styles.spacer} />

      <Actions
        primaryLabel="mover"
        onPrimary={submit}
        busy={transfer.isPending}
        disabled={!fromId || !toId || sameAccount}
      />

      <PickerSheet
        visible={picking !== null}
        title={picking === 'from' ? 'de onde sai' : 'para onde vai'}
        options={accounts.map((account) => ({
          value: account.id,
          label: account.name,
          detail: money(account.balance),
        }))}
        value={(picking === 'from' ? fromId : toId) ?? null}
        onSelect={(value) => {
          if (picking === 'from') setFromId(value);
          if (picking === 'to') setToId(value);
          setPicking(null);
        }}
        onClose={() => setPicking(null)}
      />
    </Screen>
  );
}

function AccountLine({ account }: { account: Account | undefined }) {
  if (!account) {
    return (
      <View style={styles.account}>
        <Text style={styles.placeholder}>escolher conta</Text>
        <ChevronDown />
      </View>
    );
  }

  return (
    <View style={styles.account}>
      <View style={styles.accountName}>
        <View style={[styles.mark, { backgroundColor: accountTone(account.color) }]} />
        <Text style={styles.value}>{account.name}</Text>
      </View>
      <Money style={[styles.balance, Number(account.balance) < 0 ? styles.owed : null]}>
        {money(account.balance)}
      </Money>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  needTwo: {
    marginTop: 30,
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    lineHeight: 25,
    color: colors.inkMuted,
  },
  path: { marginTop: 30, flexDirection: 'row', gap: 14 },
  spine: { width: 11, alignItems: 'center', paddingTop: 26 },
  spineStart: { width: 7, height: 7, borderRadius: 4, borderWidth: 1, borderColor: colors.rule },
  spineLine: { width: 1, flexGrow: 1, backgroundColor: colors.ruleSoft },
  spineEnd: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.sage },
  legs: { flexGrow: 1, flexShrink: 1, gap: 26 },
  account: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountName: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 3, height: 18, borderRadius: 2 },
  value: { fontFamily: fonts.sans, fontSize: 17, color: colors.ink },
  placeholder: { fontFamily: fonts.sans, fontSize: 17, color: colors.inkGhost },
  balance: { fontSize: 13, color: colors.inkFaint, ...tabular },
  owed: { color: colors.brick },
  field: { marginTop: 24 },
  amountInput: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.7,
    ...tabular,
  },
  explain: {
    marginTop: 30,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.ruleHair,
  },
  explainText: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: colors.inkMuted },
  warn: {
    marginTop: 18,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 19,
    color: colors.inkFaint,
  },
  error: { marginTop: 12, minHeight: space.touch },
  spacer: { flexGrow: 1, minHeight: 20 },
});
