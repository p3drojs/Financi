import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
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

authRouter.post('/register', validate(registerSchema), registerHandler);
authRouter.post('/login', validate(loginSchema), loginHandler);
authRouter.post('/refresh', validate(refreshSchema), refreshHandler);
authRouter.post('/logout', validate(logoutSchema), logoutHandler);
authRouter.get('/me', authMiddleware, meHandler);
