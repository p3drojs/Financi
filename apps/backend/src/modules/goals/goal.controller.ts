import { NextFunction, Request, Response } from 'express';
import * as goalService from './goal.service';
import {
  CreateContributionInput,
  CreateGoalInput,
  ListGoalsQuery,
  UpdateGoalInput,
} from './goal.schema';

export async function listGoalsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const goals = await goalService.listGoals(
      req.userId as string,
      req.query as unknown as ListGoalsQuery,
    );
    res.status(200).json(goals);
  } catch (err) {
    next(err);
  }
}

export async function getGoalHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const goal = await goalService.getGoalById(req.userId as string, req.params.id as string);
    res.status(200).json(goal);
  } catch (err) {
    next(err);
  }
}

export async function createGoalHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const goal = await goalService.createGoal(req.userId as string, req.body as CreateGoalInput);
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
}

export async function updateGoalHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const goal = await goalService.updateGoal(
      req.userId as string,
      req.params.id as string,
      req.body as UpdateGoalInput,
    );
    res.status(200).json(goal);
  } catch (err) {
    next(err);
  }
}

export async function deleteGoalHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await goalService.deleteGoal(req.userId as string, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addContributionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const goal = await goalService.addContribution(
      req.userId as string,
      req.params.id as string,
      req.body as CreateContributionInput,
    );
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
}

export async function removeContributionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const goal = await goalService.removeContribution(
      req.userId as string,
      req.params.id as string,
      req.params.contributionId as string,
    );
    res.status(200).json(goal);
  } catch (err) {
    next(err);
  }
}
