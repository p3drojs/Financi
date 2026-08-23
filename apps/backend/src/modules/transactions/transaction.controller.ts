import { NextFunction, Request, Response } from 'express';
import * as transactionService from './transaction.service';
import {
  ListRecurrencesQuery,
  ListTransactionsQuery,
  PayTransactionsInput,
  UpcomingTransactionsQuery,
} from './transaction.schema';

export async function createTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const transaction = await transactionService.createTransaction(req.userId as string, req.body);
    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
}

export async function createRecurringTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await transactionService.createRecurringTransaction(
      req.userId as string,
      req.body,
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createInstallmentTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const transactions = await transactionService.createInstallmentTransaction(
      req.userId as string,
      req.body,
    );
    res.status(201).json(transactions);
  } catch (err) {
    next(err);
  }
}

export async function listTransactionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await transactionService.listTransactions(
      req.userId as string,
      req.query as unknown as ListTransactionsQuery,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getInstallmentGroupHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const group = await transactionService.getInstallmentGroup(
      req.userId as string,
      req.params.groupId as string,
    );
    res.status(200).json(group);
  } catch (err) {
    next(err);
  }
}

export async function getTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const transaction = await transactionService.getTransactionById(
      req.userId as string,
      req.params.id as string,
    );
    res.status(200).json(transaction);
  } catch (err) {
    next(err);
  }
}

export async function updateTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const transaction = await transactionService.updateTransaction(
      req.userId as string,
      req.params.id as string,
      req.body,
    );
    res.status(200).json(transaction);
  } catch (err) {
    next(err);
  }
}

export async function payTransactionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await transactionService.payTransactions(
      req.userId as string,
      (req.body as PayTransactionsInput).ids,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getUpcomingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await transactionService.getUpcoming(
      req.userId as string,
      (req.query as unknown as UpcomingTransactionsQuery).days,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await transactionService.deleteTransaction(req.userId as string, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listRecurrencesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const recurrences = await transactionService.listRecurrences(
      req.userId as string,
      req.query as unknown as ListRecurrencesQuery,
    );
    res.status(200).json(recurrences);
  } catch (err) {
    next(err);
  }
}

export async function updateRecurrenceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await transactionService.updateRecurrence(
      req.userId as string,
      req.params.recurrenceId as string,
      req.body,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function cancelRecurrenceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await transactionService.cancelRecurrence(
      req.userId as string,
      req.params.recurrenceId as string,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
