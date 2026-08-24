import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccounts, useContribute, useGoal } from '@/api/queries';
import { Actions } from '@/components/Actions';
import { BackHeader } from '@/components/BackHeader';
import { DateField } from '@/components/DateField';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { ErrorState, InlineError, Loading } from '@/components/States';
import { TextField } from '@/components/TextField';
import { accountTone } from '@/lib/account';
import { money, monthYear } from '@/lib/format';
import { parseAmount } from '@/lib/money';
import { colors, fonts, space, tabular } from '@/theme/tokens';

export default function ContributionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ goalId: string }>();
  const query = useGoal(params.goalId);
  const accountsQuery = useAccounts();
  const contribute = useContribute(params.goalId ?? '');

  const goal = query.data;
  const accounts = accountsQuery.data ?? [];
  const vault = accounts.find((account) => account.id === goal?.accountId);
  const sources = accounts.filter((account) => account.id !== goal?.accountId);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [fromAccountId, setFromAccountId] = useState<string | undefined>();
  const [amountError, setAmountError] = useState<string | undefined>();

  const submit = () => {
    const value = parseAmount(amount);

    if (!value) {
      setAmountError('quanto você quer guardar?');
      return;
    }

    setAmountError(undefined);
    contribute.mutate({ amount: value, date, fromAccountId }, { onSuccess: () => router.back() });
  };

  if (query.error) {
    return (
      <Screen>
        <BackHeader title="guardar um pouco" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  if (query.isPending || !goal) {
    return (
      <Screen>
        <BackHeader title="guardar um pouco" />
        <Loading label="abrindo a meta" />
      </Screen>
    );
  }

  const canMoveMoney = Boolean(vault) && sources.length > 0;

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="guardar um pouco" />
      <Text style={styles.subtitle}>{`para ${goal.name.toLowerCase()}`}</Text>

      <View style={styles.field}>
        <TextField
          label="quanto"
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          keyboardType="decimal-pad"
          error={amountError}
          hint={
            goal.requiredMonthly
              ? `${money(goal.requiredMonthly)} por mês chega em ${goal.targetDate ? monthYear(goal.targetDate) : 'tempo'}`
              : undefined
          }
          inputStyle={styles.amountInput}
        />
      </View>

      <View style={styles.field}>
        <DateField label="quando" value={date} onChange={setDate} />
      </View>

      {canMoveMoney ? (
        <>
          <Text style={styles.question}>o dinheiro sai de algum lugar?</Text>

          <View style={styles.options}>
            {sources.map((account) => (
              <Pressable
                key={account.id}
                onPress={() => setFromAccountId(account.id)}
                style={[styles.option, fromAccountId === account.id ? styles.optionPicked : null]}
              >
                <View
                  style={[styles.radio, fromAccountId === account.id ? styles.radioPicked : null]}
                >
                  {fromAccountId === account.id ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.optionBody}>
                  <View style={styles.optionHead}>
                    <View style={[styles.mark, { backgroundColor: accountTone(account.color) }]} />
                    <Text style={styles.optionTitle}>{`sai do ${account.name}`}</Text>
                  </View>
                  <Text style={styles.optionNote}>
                    {`o dinheiro se move de verdade: sai daqui e entra na ${vault?.name}. Aparece no extrato como transferência, e nenhum dos dois lados vira despesa.`}
                  </Text>
                </View>
              </Pressable>
            ))}

            <Pressable
              onPress={() => setFromAccountId(undefined)}
              style={[styles.option, fromAccountId ? null : styles.optionPicked]}
            >
              <View style={[styles.radio, fromAccountId ? null : styles.radioPicked]}>
                {fromAccountId ? null : <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>só anotar</Text>
                <Text style={styles.optionNote}>
                  Nenhuma conta se mexe. Serve para dinheiro que mora fora do app.
                </Text>
              </View>
            </Pressable>
          </View>
        </>
      ) : (
        <Text style={styles.onlyNote}>
          {vault
            ? 'esta meta tem conta, mas não há outra conta de onde tirar o dinheiro — o aporte vai só ser anotado.'
            : 'esta meta não tem conta ligada, então o aporte é só escrituração: nenhuma conta se mexe.'}
        </Text>
      )}

      <View style={styles.result}>
        <Text style={styles.resultLabel}>a meta fica com</Text>
        <Money style={styles.resultValue}>
          {money(Number(goal.saved) + (parseAmount(amount) ?? 0))}
        </Money>
      </View>

      <View style={styles.error}>
        <InlineError error={contribute.error} />
      </View>

      <View style={styles.spacer} />

      <Actions primaryLabel="guardar" onPrimary={submit} busy={contribute.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  subtitle: {
    marginTop: 10,
    marginLeft: 30,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkFaint,
  },
  field: { marginTop: 24 },
  amountInput: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.7,
    ...tabular,
  },
  question: { marginTop: 30, fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  options: { marginTop: 14, gap: 12 },
  option: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.ruleFaint,
  },
  optionPicked: { borderColor: colors.sageRule },
  radio: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.rule,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioPicked: { borderColor: colors.sage },
  radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.sage },
  optionBody: { flexGrow: 1, flexShrink: 1, gap: 7 },
  optionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 3, height: 14, borderRadius: 2 },
  optionTitle: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  optionNote: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 19, color: colors.inkFaint },
  onlyNote: {
    marginTop: 26,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 21,
    color: colors.inkMuted,
  },
  result: {
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.ruleHair,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  resultLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  resultValue: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink, ...tabular },
  error: { marginTop: 12, minHeight: space.touch },
  spacer: { flexGrow: 1, minHeight: 20 },
});
