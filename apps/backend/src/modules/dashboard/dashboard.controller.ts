import { NextFunction, Request, Response } from 'express';
import * as dashboardService from './dashboard.service';
import * as forecastService from './forecast.service';
import {
  BalanceEvolutionQuery,
  ByCategoryQuery,
  ForecastQuery,
  SummaryQuery,
} from './dashboard.schema';

export async function getSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const summary = await dashboardService.getSummary(
      req.userId as string,
      req.query as unknown as SummaryQuery,
    );
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
}

export async function getByCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await dashboardService.getByCategory(
      req.userId as string,
      req.query as unknown as ByCategoryQuery,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBalanceEvolutionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await dashboardService.getBalanceEvolution(
      req.userId as string,
      req.query as unknown as BalanceEvolutionQuery,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getForecastHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await forecastService.getForecast(
      req.userId as string,
      req.query as unknown as ForecastQuery,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
