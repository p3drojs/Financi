import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const skipInTests = (): boolean => env.NODE_ENV === 'test';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: skipInTests,
  message: { message: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: skipInTests,
  message: { message: 'Limite de criação de contas atingido. Tente novamente mais tarde.' },
});
