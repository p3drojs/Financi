import { prisma } from '../../config/prisma';
import { ConflictError, UnauthorizedError } from '../../utils/AppError';
import { signAccessToken } from '../../utils/jwt';
import { comparePassword, hashPassword } from '../../utils/password';
import { LoginInput, RegisterInput } from './auth.schema';

interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  token: string;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new ConflictError('Já existe um usuário com esse email');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
  });

  const token = signAccessToken({ sub: user.id, email: user.email });

  return {
    user: { id: user.id, email: user.email, name: user.name },
    token,
  };
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

  const token = signAccessToken({ sub: user.id, email: user.email });

  return {
    user: { id: user.id, email: user.email, name: user.name },
    token,
  };
}
