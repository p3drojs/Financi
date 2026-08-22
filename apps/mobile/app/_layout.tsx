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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from '@/api/client';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError) return false;
          return failureCount < 2;
        },
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

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
  const [queryClient] = useState(createQueryClient);
  const ready = Boolean(serifLoaded || serifError) && Boolean(sansLoaded || sansError);

  if (!ready) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <SessionGate>
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
          </SessionGate>
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function SessionGate({ children }: { children: ReactNode }) {
  const { restoring, signedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (restoring) return;

    SplashScreen.hideAsync().catch(() => undefined);

    const onSignIn = segments[0] === 'entrar';

    if (!signedIn && !onSignIn) {
      router.replace('/entrar');
    } else if (signedIn && onSignIn) {
      router.replace('/');
    }
  }, [restoring, signedIn, segments, router]);

  if (restoring) {
    return null;
  }

  return <>{children}</>;
}
