import { AuthResult, AuthUser } from '@/api/types';
import { readItem, removeItem, writeItem } from './storage';

const TOKEN_KEY = 'financi.token';
const REFRESH_TOKEN_KEY = 'financi.refreshToken';
const USER_KEY = 'financi.user';

export interface Session {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export async function loadSession(): Promise<Session | null> {
  const [token, refreshToken, rawUser] = await Promise.all([
    readItem(TOKEN_KEY),
    readItem(REFRESH_TOKEN_KEY),
    readItem(USER_KEY),
  ]);

  if (!token || !refreshToken || !rawUser) return null;

  try {
    return { token, refreshToken, user: JSON.parse(rawUser) as AuthUser };
  } catch {
    return null;
  }
}

export async function saveSession(result: AuthResult): Promise<Session> {
  await Promise.all([
    writeItem(TOKEN_KEY, result.token),
    writeItem(REFRESH_TOKEN_KEY, result.refreshToken),
    writeItem(USER_KEY, JSON.stringify(result.user)),
  ]);

  return { token: result.token, refreshToken: result.refreshToken, user: result.user };
}

export async function clearSession(): Promise<void> {
  await Promise.all([removeItem(TOKEN_KEY), removeItem(REFRESH_TOKEN_KEY), removeItem(USER_KEY)]);
}
