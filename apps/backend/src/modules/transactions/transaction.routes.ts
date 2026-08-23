import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  cancelRecurrenceHandler,
  createInstallmentTransactionHandler,
  createRecurringTransactionHandler,
  createTransactionHandler,
  deleteTransactionHandler,
  getInstallmentGroupHandler,
  getUpcomingHandler,
  getTransactionHandler,
  listRecurrencesHandler,
  listTransactionsHandler,
  payTransactionsHandler,
  updateRecurrenceHandler,
  updateTransactionHandler,
} from './transaction.controller';
import {
  createInstallmentTransactionSchema,
  createRecurringTransactionSchema,
  createTransactionSchema,
  installmentGroupParamSchema,
  listRecurrencesSchema,
  listTransactionsSchema,
  payTransactionsSchema,
  recurrenceIdParamSchema,
  transactionIdParamSchema,
  updateRecurrenceSchema,
  updateTransactionSchema,
  upcomingTransactionsSchema,
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
transactionRouter.get('/recurring', validate(listRecurrencesSchema), listRecurrencesHandler);
transactionRouter.get('/upcoming', validate(upcomingTransactionsSchema), getUpcomingHandler);
transactionRouter.post('/pay', validate(payTransactionsSchema), payTransactionsHandler);
transactionRouter.get(
  '/installments/:groupId',
  validate(installmentGroupParamSchema),
  getInstallmentGroupHandler,
);
transactionRouter.get('/:id', validate(transactionIdParamSchema), getTransactionHandler);
transactionRouter.patch('/:id', validate(updateTransactionSchema), updateTransactionHandler);
transactionRouter.delete('/:id', validate(transactionIdParamSchema), deleteTransactionHandler);
transactionRouter.patch(
  '/recurring/:recurrenceId',
  validate(updateRecurrenceSchema),
  updateRecurrenceHandler,
);
transactionRouter.delete(
  '/recurring/:recurrenceId',
  validate(recurrenceIdParamSchema),
  cancelRecurrenceHandler,
);
