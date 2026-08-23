import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from '@/api/client';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { SyncBanner } from '@/components/SyncBanner';
import { SyncStatusProvider } from '@/sync/SyncStatus';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError) return false;
          return failureCount < 2;
        },
        staleTime: 30 * 1000,
        gcTime: CACHE_MAX_AGE,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'financi-query-cache',
});

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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: CACHE_MAX_AGE }}
    >
      <SyncStatusProvider>
        <AuthProvider>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <SyncBanner />
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
                <Stack.Screen name="repeticoes" />
                <Stack.Screen name="recorrencia/[id]" />
                <Stack.Screen name="contas" />
                <Stack.Screen name="conta/nova" />
                <Stack.Screen name="conta/[id]" />
                <Stack.Screen name="transferencia" />
                <Stack.Screen name="a-pagar" />
                <Stack.Screen name="orcamento" />
                <Stack.Screen name="meta/nova" />
                <Stack.Screen name="meta/[id]" />
                <Stack.Screen name="meta/aporte" />
                <Stack.Screen name="nova/index" />
                <Stack.Screen name="nova/parcelada" />
              </Stack>
            </SessionGate>
          </SafeAreaProvider>
        </AuthProvider>
      </SyncStatusProvider>
    </PersistQueryClientProvider>
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
