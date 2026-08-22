import { useQueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onUnauthorized, setAuthToken } from '@/api/client';
import * as api from '@/api/endpoints';
import { AuthUser, LoginInput, RegisterInput } from '@/api/types';
import { clearSession, loadSession, saveSession } from './session';

interface AuthContextValue {
  user: AuthUser | null;
  restoring: boolean;
  signedIn: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [restoring, setRestoring] = useState(true);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await clearSession();
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    let active = true;

    loadSession()
      .then((session) => {
        if (!active) return;
        if (session) {
          setAuthToken(session.token);
          setUser(session.user);
        }
      })
      .finally(() => {
        if (active) setRestoring(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    onUnauthorized(() => {
      void signOut();
    });

    return () => onUnauthorized(null);
  }, [signOut]);

  const adopt = useCallback(
    async (result: Awaited<ReturnType<typeof api.auth.login>>) => {
      const session = await saveSession(result);
      setAuthToken(session.token);
      setUser(session.user);
      queryClient.clear();
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      restoring,
      signedIn: user !== null,
      signIn: async (input) => adopt(await api.auth.login(input)),
      signUp: async (input) => adopt(await api.auth.register(input)),
      signOut,
    }),
    [user, restoring, adopt, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa estar dentro de AuthProvider');
  }

  return context;
}
