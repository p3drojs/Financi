import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

interface ActionsProps {
  primaryLabel: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryTone?: 'muted' | 'danger';
}

export function Actions({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  secondaryTone = 'muted',
}: ActionsProps) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.primary} onPress={onPrimary}>
        <Text style={styles.primaryLabel}>{primaryLabel}</Text>
      </Pressable>
      {secondaryLabel ? (
        <Pressable style={styles.secondary} onPress={onSecondary}>
          <Text
            style={[
              styles.secondaryLabel,
              secondaryTone === 'danger' ? styles.secondaryDanger : null,
            ]}
          >
            {secondaryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  primary: {
    flexGrow: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  secondary: { height: 52, paddingHorizontal: 8, justifyContent: 'center' },
  secondaryLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkFaint },
  secondaryDanger: { color: colors.brick },
});
