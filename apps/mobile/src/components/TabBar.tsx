import { BottomTabBarProps } from 'expo-router/tabs';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlusIcon } from '@/components/icons';
import { colors, fonts, space } from '@/theme/tokens';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.bar, { height: space.tabBar + insets.bottom, paddingBottom: insets.bottom }]}>
      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key] as { options: { title?: string } };

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab}>
              <Text style={[styles.label, focused ? styles.labelActive : null]}>
                {options.title ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.fab} onPress={() => router.push('/nova')}>
        <PlusIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.ruleHair,
    paddingHorizontal: space.gutter,
    backgroundColor: colors.paper,
  },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 1 },
  tab: { minHeight: space.touch, justifyContent: 'center', flexShrink: 1 },
  label: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkFaint },
  labelActive: { color: colors.ink },
  fab: {
    width: 46,
    flexShrink: 0,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
