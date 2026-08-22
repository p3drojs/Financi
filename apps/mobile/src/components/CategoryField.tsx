import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Category } from '@/api/types';
import { Field } from '@/components/Field';
import { PickerSheet } from '@/components/PickerSheet';
import { Stroke } from '@/components/Stroke';
import { ChevronDown } from '@/components/icons';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, type } from '@/theme/tokens';

interface CategoryFieldProps {
  label?: string;
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string) => void;
  hint?: string;
}

export function CategoryField({
  label = 'em que categoria',
  categories,
  value,
  onChange,
  hint,
}: CategoryFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((item) => item.id === value) ?? null;

  return (
    <Field label={label} hint={hint}>
      <Pressable style={styles.row} onPress={() => setOpen(true)}>
        <View style={styles.name}>
          {selected ? <Stroke color={onPaper(selected.color)} width={20} /> : null}
          <Text style={selected ? type.field : styles.placeholder}>
            {selected ? selected.name : 'escolher uma'}
          </Text>
        </View>
        <ChevronDown size={9} />
      </Pressable>

      <PickerSheet
        visible={open}
        title={label}
        options={categories.map((item) => ({ value: item.id, label: item.name }))}
        value={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </Field>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  placeholder: { fontFamily: fonts.sans, fontSize: 17, color: colors.inkGhost },
});
