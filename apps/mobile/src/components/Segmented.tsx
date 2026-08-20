import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, space } from '@/theme/tokens';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)} style={styles.item}>
            <Text style={[styles.label, active ? styles.labelActive : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  item: { minHeight: space.touch, justifyContent: 'center' },
  label: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.inkFaint,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    paddingBottom: 3,
  },
  labelActive: { color: colors.ink, borderBottomColor: colors.rule },
});
