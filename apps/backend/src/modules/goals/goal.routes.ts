import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  addContributionHandler,
  createGoalHandler,
  deleteGoalHandler,
  getGoalHandler,
  listGoalsHandler,
  removeContributionHandler,
  updateGoalHandler,
} from './goal.controller';
import {
  contributionParamSchema,
  createContributionSchema,
  createGoalSchema,
  goalIdParamSchema,
  listGoalsSchema,
  updateGoalSchema,
} from './goal.schema';

export const goalRouter = Router();

goalRouter.use(authMiddleware);

goalRouter.get('/', validate(listGoalsSchema), listGoalsHandler);
goalRouter.post('/', validate(createGoalSchema), createGoalHandler);
goalRouter.get('/:id', validate(goalIdParamSchema), getGoalHandler);
goalRouter.patch('/:id', validate(updateGoalSchema), updateGoalHandler);
goalRouter.delete('/:id', validate(goalIdParamSchema), deleteGoalHandler);
goalRouter.post('/:id/contributions', validate(createContributionSchema), addContributionHandler);
goalRouter.delete(
  '/:id/contributions/:contributionId',
  validate(contributionParamSchema),
  removeContributionHandler,
);
