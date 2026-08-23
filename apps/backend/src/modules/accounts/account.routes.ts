import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createAccountHandler,
  deleteAccountHandler,
  getAccountHandler,
  listAccountsHandler,
  updateAccountHandler,
} from './account.controller';
import {
  accountIdParamSchema,
  createAccountSchema,
  listAccountsSchema,
  updateAccountSchema,
} from './account.schema';

export const accountRouter = Router();

accountRouter.use(authMiddleware);

accountRouter.get('/', validate(listAccountsSchema), listAccountsHandler);
accountRouter.post('/', validate(createAccountSchema), createAccountHandler);
accountRouter.get('/:id', validate(accountIdParamSchema), getAccountHandler);
accountRouter.patch('/:id', validate(updateAccountSchema), updateAccountHandler);
accountRouter.delete('/:id', validate(accountIdParamSchema), deleteAccountHandler);
