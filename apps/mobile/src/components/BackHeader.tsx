import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from '@/components/icons';
import { space, type } from '@/theme/tokens';

interface BackHeaderProps {
  title: string;
  compact?: boolean;
}

export function BackHeader({ title, compact = false }: BackHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ChevronLeft />
      </Pressable>
      <Text style={[compact ? type.titleSmall : type.title, styles.title]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 30, flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -14 },
  back: {
    width: space.touch,
    height: space.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flexShrink: 1 },
});
