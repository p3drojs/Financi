import { NextFunction, Request, Response } from 'express';
import * as accountService from './account.service';
import { CreateAccountInput, ListAccountsQuery, UpdateAccountInput } from './account.schema';

export async function listAccountsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const accounts = await accountService.listAccounts(
      req.userId as string,
      req.query as unknown as ListAccountsQuery,
    );
    res.status(200).json(accounts);
  } catch (err) {
    next(err);
  }
}

export async function getAccountHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = await accountService.getAccountById(
      req.userId as string,
      req.params.id as string,
    );
    res.status(200).json(account);
  } catch (err) {
    next(err);
  }
}

export async function createAccountHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = await accountService.createAccount(
      req.userId as string,
      req.body as CreateAccountInput,
    );
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
}

export async function updateAccountHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = await accountService.updateAccount(
      req.userId as string,
      req.params.id as string,
      req.body as UpdateAccountInput,
    );
    res.status(200).json(account);
  } catch (err) {
    next(err);
  }
}

export async function deleteAccountHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await accountService.deleteAccount(req.userId as string, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
