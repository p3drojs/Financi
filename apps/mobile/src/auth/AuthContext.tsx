import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onUnauthorized, setAuthToken, setTokenRefresher } from '@/api/client';
import * as api from '@/api/endpoints';
import { AuthUser, LoginInput, RegisterInput } from '@/api/types';
import { clearSession, loadSession, saveSession, Session } from './session';

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
  const refreshToken = useRef<string | null>(null);

  const adoptSession = useCallback((session: Session) => {
    refreshToken.current = session.refreshToken;
    setAuthToken(session.token);
    setUser(session.user);
  }, []);

  const signOut = useCallback(async () => {
    refreshToken.current = null;
    setAuthToken(null);
    setUser(null);
    await clearSession();
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    let active = true;

    loadSession()
      .then((session) => {
        if (!active || !session) return;
        adoptSession(session);
      })
      .finally(() => {
        if (active) setRestoring(false);
      });

    return () => {
      active = false;
    };
  }, [adoptSession]);

  useEffect(() => {
    onUnauthorized(() => {
      void signOut();
    });

    return () => onUnauthorized(null);
  }, [signOut]);

  useEffect(() => {
    setTokenRefresher(async () => {
      const current = refreshToken.current;
      if (!current) return null;

      const session = await saveSession(await api.auth.refresh(current));
      adoptSession(session);

      return session.token;
    });

    return () => setTokenRefresher(null);
  }, [adoptSession]);

  const adopt = useCallback(
    async (result: Awaited<ReturnType<typeof api.auth.login>>) => {
      adoptSession(await saveSession(result));
      queryClient.clear();
    },
    [adoptSession, queryClient],
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
