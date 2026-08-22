import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '@/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  gutter?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({ children, scroll = false, gutter = true, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + 12,
    paddingHorizontal: gutter ? space.gutter : 0,
  };

  if (scroll) {
    return (
      <View style={styles.paper}>
        <ScrollView
          style={styles.paper}
          contentContainerStyle={[padding, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return <View style={[styles.paper, padding, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  paper: { flex: 1, backgroundColor: colors.paper },
});
