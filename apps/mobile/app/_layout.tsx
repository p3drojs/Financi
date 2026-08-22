import {
  Karla_300Light,
  Karla_400Regular,
  Karla_500Medium,
  useFonts as useKarla,
} from '@expo-google-fonts/karla';
import {
  Newsreader_200ExtraLight,
  Newsreader_300Light,
  Newsreader_300Light_Italic,
  useFonts as useNewsreader,
} from '@expo-google-fonts/newsreader';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [serifLoaded, serifError] = useNewsreader({
    Newsreader_200ExtraLight,
    Newsreader_300Light,
    Newsreader_300Light_Italic,
  });
  const [sansLoaded, sansError] = useKarla({
    Karla_300Light,
    Karla_400Regular,
    Karla_500Medium,
  });
  const ready = Boolean(serifLoaded || serifError) && Boolean(sansLoaded || sansError);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="entrar" />
        <Stack.Screen name="transacao/[id]" />
        <Stack.Screen name="parcelamento/[groupId]" />
        <Stack.Screen name="etiquetas" />
        <Stack.Screen name="categorias" />
        <Stack.Screen name="categoria/[id]" />
        <Stack.Screen name="recorrencia/[id]" />
        <Stack.Screen name="nova/index" />
        <Stack.Screen name="nova/parcelada" />
      </Stack>
    </SafeAreaProvider>
  );
}
