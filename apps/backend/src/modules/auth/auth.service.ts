import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { createDefaultCategories } from '../categories/category.service';
import { NotFoundError, ConflictError, UnauthorizedError } from '../../utils/AppError';
import { signAccessToken } from '../../utils/jwt';
import { comparePassword, hashPassword } from '../../utils/password';
import { generateRefreshToken, hashRefreshToken } from '../../utils/refreshToken';
import { LoginInput, RegisterInput } from './auth.schema';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthResult {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

async function issueRefreshToken(userId: string): Promise<string> {
  const raw = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashRefreshToken(raw), expiresAt },
  });

  return raw;
}

async function buildAuthResult(user: AuthUser): Promise<AuthResult> {
  const [token, refreshToken] = await Promise.all([
    signAccessToken({ sub: user.id, email: user.email }),
    issueRefreshToken(user.id),
  ]);

  return { user, token, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new ConflictError('Já existe um usuário com esse email');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
      },
    });

    await createDefaultCategories(created.id, tx);

    return created;
  });

  return buildAuthResult({ id: user.id, email: user.email, name: user.name });
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new UnauthorizedError('Email ou senha inválidos');
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new UnauthorizedError('Email ou senha inválidos');
  }

  return buildAuthResult({ id: user.id, email: user.email, name: user.name });
}

export async function getCurrentUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  return { id: user.id, email: user.email, name: user.name };
}

export async function refreshSession(rawToken: string): Promise<AuthResult> {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Sessão inválida ou expirada, faça login novamente');
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });

  if (!user) {
    throw new UnauthorizedError('Sessão inválida ou expirada, faça login novamente');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return buildAuthResult({ id: user.id, email: user.email, name: user.name });
}

export async function revokeSession(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);

  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
