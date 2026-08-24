import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAccounts } from '@/api/queries';
import { Money } from '@/components/Money';
import { money } from '@/lib/format';
import { colors, fonts, space, tabular } from '@/theme/tokens';

export function AccountStrip() {
  const query = useAccounts();
  const accounts = query.data ?? [];

  if (accounts.length < 2) {
    return null;
  }

  const total = accounts.reduce((sum, account) => sum + Number(account.balance), 0);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.content}
    >
      <Link href="/contas" asChild>
        <Pressable style={styles.item}>
          <Text style={styles.labelStrong}>tudo</Text>
          <Money style={styles.valueStrong}>{money(total)}</Money>
        </Pressable>
      </Link>

      {accounts.map((account) => (
        <Link key={account.id} href={`/conta/${account.id}`} asChild>
          <Pressable style={styles.item}>
            <Text style={styles.label} numberOfLines={1}>
              {account.name}
            </Text>
            <Money style={[styles.value, Number(account.balance) < 0 ? styles.owed : null]}>
              {money(account.balance)}
            </Money>
          </Pressable>
        </Link>
      ))}

      <View style={styles.tail} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { marginTop: 20, marginHorizontal: -space.gutter },
  content: { paddingHorizontal: space.gutter, gap: 20, alignItems: 'flex-start' },
  item: { gap: 3, maxWidth: 130 },
  label: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  labelStrong: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink },
  value: { fontSize: 13, color: colors.inkMuted, ...tabular },
  valueStrong: { fontSize: 13, color: colors.ink, ...tabular },
  owed: { color: colors.brick },
  tail: { width: 4 },
});
