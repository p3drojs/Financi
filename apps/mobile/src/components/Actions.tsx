import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

interface ActionsProps {
  primaryLabel: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryTone?: 'muted' | 'danger';
  busy?: boolean;
  disabled?: boolean;
}

export function Actions({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  secondaryTone = 'muted',
  busy = false,
  disabled = false,
}: ActionsProps) {
  const blocked = busy || disabled;

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.primary, blocked ? styles.primaryBlocked : null]}
        onPress={onPrimary}
        disabled={blocked}
      >
        {busy ? (
          <ActivityIndicator color={colors.inkMuted} />
        ) : (
          <Text style={[styles.primaryLabel, disabled ? styles.primaryLabelBlocked : null]}>
            {primaryLabel}
          </Text>
        )}
      </Pressable>
      {secondaryLabel ? (
        <Pressable style={styles.secondary} onPress={onSecondary} disabled={busy}>
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
  primaryBlocked: { borderColor: colors.rule },
  primaryLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  primaryLabelBlocked: { color: colors.inkFaint },
  secondary: { height: 52, paddingHorizontal: 8, justifyContent: 'center' },
  secondaryLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkFaint },
  secondaryDanger: { color: colors.brick },
});
