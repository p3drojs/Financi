import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSyncStatus } from '@/sync/SyncStatus';
import { colors, fonts } from '@/theme/tokens';

export function SyncBanner() {
  const { isSyncing } = useSyncStatus();

  if (!isSyncing) return null;

  return (
    <View style={styles.bar}>
      <ActivityIndicator size="small" color={colors.paper} />
      <Text style={styles.label}>sincronizando — ainda não dá pra editar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
    backgroundColor: colors.sage,
  },
  label: { fontFamily: fonts.sans, fontSize: 12, color: colors.paper },
});
