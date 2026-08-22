import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Field } from '@/components/Field';
import { colors, fonts } from '@/theme/tokens';

const MAX_TAGS = 20;
const MAX_LENGTH = 40;

interface TagsFieldProps {
  label?: string;
  value: string[];
  onChange: (names: string[]) => void;
  hint?: string;
}

export function TagsField({ label = 'etiquetas', value, onChange, hint }: TagsFieldProps) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const name = draft.trim().slice(0, MAX_LENGTH);
    setDraft('');

    if (!name || value.length >= MAX_TAGS) return;
    if (value.some((existing) => existing.toLowerCase() === name.toLowerCase())) return;

    onChange([...value, name]);
  };

  return (
    <Field label={label} hint={hint}>
      <View style={styles.row}>
        {value.map((name) => (
          <Pressable
            key={name}
            style={styles.tag}
            onPress={() => onChange(value.filter((item) => item !== name))}
          >
            <Text style={styles.tagLabel}>{name}</Text>
            <Text style={styles.tagRemove}>×</Text>
          </Pressable>
        ))}
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={commit}
          onBlur={commit}
          placeholder={value.length > 0 ? 'escrever outra' : 'escrever uma'}
          placeholderTextColor={colors.inkGhost}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          style={styles.input}
        />
      </View>
    </Field>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagLabel: { fontFamily: fonts.sans, fontSize: 17, color: colors.ink },
  tagRemove: { fontFamily: fonts.sans, fontSize: 17, color: colors.inkFaint },
  input: {
    fontFamily: fonts.sans,
    fontSize: 17,
    color: colors.ink,
    minWidth: 120,
    flexGrow: 1,
    paddingVertical: 0,
  },
});
