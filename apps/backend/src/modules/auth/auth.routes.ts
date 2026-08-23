import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { loginLimiter, registerLimiter } from '../../middlewares/rateLimit.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
} from './auth.controller';
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validate(registerSchema), registerHandler);
authRouter.post('/login', loginLimiter, validate(loginSchema), loginHandler);
authRouter.post('/refresh', validate(refreshSchema), refreshHandler);
authRouter.post('/logout', validate(logoutSchema), logoutHandler);
authRouter.get('/me', authMiddleware, meHandler);
