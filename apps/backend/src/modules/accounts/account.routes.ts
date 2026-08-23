import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createAccountHandler,
  createTransferHandler,
  deleteAccountHandler,
  deleteTransferHandler,
  getAccountHandler,
  listAccountsHandler,
  updateAccountHandler,
} from './account.controller';
import {
  accountIdParamSchema,
  createAccountSchema,
  createTransferSchema,
  listAccountsSchema,
  transferGroupParamSchema,
  updateAccountSchema,
} from './account.schema';

export const accountRouter = Router();

accountRouter.use(authMiddleware);

accountRouter.get('/', validate(listAccountsSchema), listAccountsHandler);
accountRouter.post('/', validate(createAccountSchema), createAccountHandler);
accountRouter.post('/transfers', validate(createTransferSchema), createTransferHandler);
accountRouter.delete(
  '/transfers/:transferGroupId',
  validate(transferGroupParamSchema),
  deleteTransferHandler,
);
accountRouter.get('/:id', validate(accountIdParamSchema), getAccountHandler);
accountRouter.patch('/:id', validate(updateAccountSchema), updateAccountHandler);
accountRouter.delete('/:id', validate(accountIdParamSchema), deleteAccountHandler);
