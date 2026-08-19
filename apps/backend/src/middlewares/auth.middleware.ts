import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de autenticação ausente');
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    throw new UnauthorizedError('Token de autenticação inválido ou expirado');
  }
}
