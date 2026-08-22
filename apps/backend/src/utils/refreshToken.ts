import { createHash, randomBytes } from 'node:crypto';

const TOKEN_BYTES = 48;

export function generateRefreshToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
