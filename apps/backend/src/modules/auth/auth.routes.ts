import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { loginHandler, registerHandler } from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), registerHandler);
authRouter.post('/login', validate(loginSchema), loginHandler);
