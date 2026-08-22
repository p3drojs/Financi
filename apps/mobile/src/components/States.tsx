import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError, NetworkError } from '@/api/client';
import { colors, fonts, space, type } from '@/theme/tokens';

export function Loading({ label = 'lendo o caderno' }: { label?: string }) {
  return (
    <View style={styles.block}>
      <ActivityIndicator color={colors.inkFaint} />
      <Text style={type.caption}>{label}</Text>
    </View>
  );
}

export function messageOf(error: unknown): string {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'algo deu errado por aqui';
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.block}>
      <Text style={styles.message}>{messageOf(error)}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryLabel}>tentar de novo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.empty}>{text}</Text>
    </View>
  );
}

export function InlineError({ error }: { error: unknown }) {
  if (!error) return null;

  return <Text style={styles.inline}>{messageOf(error)}</Text>;
}

const styles = StyleSheet.create({
  block: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  message: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.brick,
    textAlign: 'center',
  },
  empty: {
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkFaint,
    textAlign: 'center',
  },
  retry: { minHeight: space.touch, justifyContent: 'center' },
  retryLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.sage,
    borderBottomWidth: 1,
    borderBottomColor: colors.sageRule,
    paddingBottom: 2,
  },
  inline: { fontFamily: fonts.sans, fontSize: 13, color: colors.brick, lineHeight: 20 },
});
