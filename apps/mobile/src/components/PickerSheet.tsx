import { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, space, type } from '@/theme/tokens';

export interface PickerOption<T extends string> {
  value: T;
  label: string;
  detail?: string;
}

interface PickerSheetProps<T extends string> {
  visible: boolean;
  title: string;
  options: PickerOption<T>[];
  value: T | null;
  onSelect: (value: T) => void;
  onClose: () => void;
  footer?: ReactNode;
}

export function PickerSheet<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
  footer,
}: PickerSheetProps<T>) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const active = option.value === value;

              return (
                <Pressable
                  key={option.value}
                  style={styles.option}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                >
                  <View style={styles.optionBody}>
                    <Text style={[styles.optionLabel, active ? styles.optionLabelActive : null]}>
                      {option.label}
                    </Text>
                    {option.detail ? <Text style={type.caption}>{option.detail}</Text> : null}
                  </View>
                  {active ? <View style={styles.marker} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
          {footer}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10, 9, 7, 0.72)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.paperRaised,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: space.gutter,
    paddingTop: 22,
    maxHeight: '72%',
  },
  title: { fontFamily: fonts.serifItalic, fontSize: 20, color: colors.ink, marginBottom: 8 },
  list: { flexGrow: 0 },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleHair,
  },
  optionBody: { gap: 3, flexShrink: 1 },
  optionLabel: { fontFamily: fonts.sans, fontSize: 16, color: colors.inkMuted },
  optionLabelActive: { color: colors.ink },
  marker: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sage },
});
