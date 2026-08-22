import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';

export const accountRouter = Router();

accountRouter.use(authMiddleware);
