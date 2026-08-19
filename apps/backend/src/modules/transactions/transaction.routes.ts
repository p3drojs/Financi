import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  cancelRecurrenceHandler,
  createInstallmentTransactionHandler,
  createRecurringTransactionHandler,
  createTransactionHandler,
  deleteTransactionHandler,
  getTransactionHandler,
  listTransactionsHandler,
  updateTransactionHandler,
} from './transaction.controller';
import {
  createInstallmentTransactionSchema,
  createRecurringTransactionSchema,
  createTransactionSchema,
  listTransactionsSchema,
  recurrenceIdParamSchema,
  transactionIdParamSchema,
  updateTransactionSchema,
} from './transaction.schema';

export const transactionRouter = Router();

transactionRouter.use(authMiddleware);

transactionRouter.post('/', validate(createTransactionSchema), createTransactionHandler);
transactionRouter.post(
  '/recurring',
  validate(createRecurringTransactionSchema),
  createRecurringTransactionHandler,
);
transactionRouter.post(
  '/installments',
  validate(createInstallmentTransactionSchema),
  createInstallmentTransactionHandler,
);
transactionRouter.get('/', validate(listTransactionsSchema), listTransactionsHandler);
transactionRouter.get('/:id', validate(transactionIdParamSchema), getTransactionHandler);
transactionRouter.patch('/:id', validate(updateTransactionSchema), updateTransactionHandler);
transactionRouter.delete('/:id', validate(transactionIdParamSchema), deleteTransactionHandler);
transactionRouter.delete(
  '/recurring/:recurrenceId',
  validate(recurrenceIdParamSchema),
  cancelRecurrenceHandler,
);
