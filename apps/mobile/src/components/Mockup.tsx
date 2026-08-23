import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

export function MockupNote({ text = 'ainda é maquete — esta tela não fala com o servidor' }) {
  return (
    <View style={styles.note}>
      <View style={styles.mark} />
      <Text style={styles.label}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.inkGhost },
  label: { fontFamily: fonts.sans, fontSize: 11, color: colors.inkGhost },
});
