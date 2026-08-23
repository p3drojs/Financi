import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextField } from '@/components/TextField';
import { parseAmount } from '@/lib/money';
import { colors, fonts, space, tabular } from '@/theme/tokens';

interface AmountSheetProps {
  visible: boolean;
  title: string;
  label: string;
  initial?: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: (amount: number) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export function AmountSheet({
  visible,
  title,
  label,
  initial = '',
  confirmLabel = 'guardar',
  busy = false,
  onConfirm,
  onRemove,
  onClose,
}: AmountSheetProps) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (visible) {
      setValue(initial);
      setError(undefined);
    }
  }, [visible, initial]);

  const confirm = () => {
    const amount = parseAmount(value);

    if (!amount) {
      setError('escreva um valor');
      return;
    }

    onConfirm(amount);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.title}>{title}</Text>

          <TextField
            label={label}
            value={value}
            onChangeText={setValue}
            placeholder="0,00"
            keyboardType="decimal-pad"
            error={error}
            inputStyle={styles.input}
          />

          <View style={styles.actions}>
            <Pressable style={styles.confirm} onPress={confirm} disabled={busy}>
              <Text style={styles.confirmLabel}>{busy ? 'guardando' : confirmLabel}</Text>
            </Pressable>
            {onRemove ? (
              <Pressable style={styles.remove} onPress={onRemove} disabled={busy}>
                <Text style={styles.removeLabel}>tirar o teto</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10, 9, 7, 0.72)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.paperRaised,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: space.gutter,
    paddingTop: 24,
    gap: 20,
  },
  title: { fontFamily: fonts.serifItalic, fontSize: 20, color: colors.ink },
  input: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, ...tabular },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  confirm: {
    flexGrow: 1,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.sageRule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.sage },
  remove: { minHeight: 48, paddingHorizontal: 16, justifyContent: 'center' },
  removeLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.brick },
});
