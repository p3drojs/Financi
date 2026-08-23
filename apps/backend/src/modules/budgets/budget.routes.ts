import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  copyBudgetsHandler,
  createBudgetHandler,
  deleteBudgetHandler,
  listBudgetsHandler,
  updateBudgetHandler,
} from './budget.controller';
import {
  budgetIdParamSchema,
  copyBudgetSchema,
  createBudgetSchema,
  listBudgetsSchema,
  updateBudgetSchema,
} from './budget.schema';

export const budgetRouter = Router();

budgetRouter.use(authMiddleware);

budgetRouter.get('/', validate(listBudgetsSchema), listBudgetsHandler);
budgetRouter.post('/', validate(createBudgetSchema), createBudgetHandler);
budgetRouter.post('/copy', validate(copyBudgetSchema), copyBudgetsHandler);
budgetRouter.patch('/:id', validate(updateBudgetSchema), updateBudgetHandler);
budgetRouter.delete('/:id', validate(budgetIdParamSchema), deleteBudgetHandler);
