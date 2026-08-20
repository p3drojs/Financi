import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '@/theme/tokens';

interface FieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export function Field({ label, children, hint }: FieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={type.label}>{label}</Text>
      <View style={styles.line}>{children}</View>
      {hint ? <Text style={[type.caption, styles.hint]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingBottom: 9,
    minHeight: 30,
    justifyContent: 'flex-end',
  },
  hint: { marginTop: 3 },
});
