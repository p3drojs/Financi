import { StyleProp, StyleSheet, Text, TextInput, TextStyle, View } from 'react-native';
import { colors, type } from '@/theme/tokens';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'decimal-pad' | 'numeric';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  inputStyle?: StyleProp<TextStyle>;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  inputStyle,
}: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkGhost}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={[styles.input, error ? styles.inputError : null, inputStyle]}
      />
      {error ? <Text style={[type.caption, styles.error]}>{error}</Text> : null}
      {!error && hint ? <Text style={[type.caption, styles.hint]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  input: {
    ...type.field,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingBottom: 9,
    paddingTop: 0,
    minHeight: 34,
  },
  inputError: { borderBottomColor: colors.brickRule },
  hint: { marginTop: 3 },
  error: { marginTop: 3, color: colors.brick },
});
