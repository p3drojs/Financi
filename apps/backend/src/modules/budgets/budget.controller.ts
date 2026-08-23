import { NextFunction, Request, Response } from 'express';
import * as budgetService from './budget.service';
import {
  CopyBudgetInput,
  CreateBudgetInput,
  ListBudgetsQuery,
  UpdateBudgetInput,
} from './budget.schema';

export async function listBudgetsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await budgetService.listBudgets(
      req.userId as string,
      req.query as unknown as ListBudgetsQuery,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createBudgetHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const budget = await budgetService.createBudget(
      req.userId as string,
      req.body as CreateBudgetInput,
    );
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
}

export async function updateBudgetHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const budget = await budgetService.updateBudget(
      req.userId as string,
      req.params.id as string,
      (req.body as UpdateBudgetInput).amount,
    );
    res.status(200).json(budget);
  } catch (err) {
    next(err);
  }
}

export async function deleteBudgetHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await budgetService.deleteBudget(req.userId as string, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function copyBudgetsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await budgetService.copyBudgets(
      req.userId as string,
      req.body as CopyBudgetInput,
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
