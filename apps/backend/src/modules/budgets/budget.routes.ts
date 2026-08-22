import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';

export const budgetRouter = Router();

budgetRouter.use(authMiddleware);
