import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';

export const goalRouter = Router();

goalRouter.use(authMiddleware);
