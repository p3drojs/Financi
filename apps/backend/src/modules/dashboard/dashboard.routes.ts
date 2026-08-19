import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  getBalanceEvolutionHandler,
  getByCategoryHandler,
  getSummaryHandler,
} from './dashboard.controller';
import { balanceEvolutionSchema, byCategorySchema, summarySchema } from './dashboard.schema';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);

dashboardRouter.get('/summary', validate(summarySchema), getSummaryHandler);
dashboardRouter.get('/by-category', validate(byCategorySchema), getByCategoryHandler);
dashboardRouter.get(
  '/balance-evolution',
  validate(balanceEvolutionSchema),
  getBalanceEvolutionHandler,
);
