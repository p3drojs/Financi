import { AuthResult, AuthUser } from '@/api/types';
import { readItem, removeItem, writeItem } from './storage';

const TOKEN_KEY = 'financi.token';
const USER_KEY = 'financi.user';

export interface Session {
  token: string;
  user: AuthUser;
}

export async function loadSession(): Promise<Session | null> {
  const [token, rawUser] = await Promise.all([readItem(TOKEN_KEY), readItem(USER_KEY)]);

  if (!token || !rawUser) return null;

  try {
    return { token, user: JSON.parse(rawUser) as AuthUser };
  } catch {
    return null;
  }
}

export async function saveSession(result: AuthResult): Promise<Session> {
  await Promise.all([
    writeItem(TOKEN_KEY, result.token),
    writeItem(USER_KEY, JSON.stringify(result.user)),
  ]);

  return { token: result.token, user: result.user };
}

export async function clearSession(): Promise<void> {
  await Promise.all([removeItem(TOKEN_KEY), removeItem(USER_KEY)]);
}
