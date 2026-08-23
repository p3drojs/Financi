import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { accountRouter } from './modules/accounts/account.routes';
import { authRouter } from './modules/auth/auth.routes';
import { budgetRouter } from './modules/budgets/budget.routes';
import { categoryRouter } from './modules/categories/category.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { docsRouter } from './modules/docs/docs.routes';
import { goalRouter } from './modules/goals/goal.routes';
import { healthRouter } from './modules/health/health.routes';
import { tagRouter } from './modules/tags/tag.routes';
import { transactionRouter } from './modules/transactions/transaction.routes';

const allowedOrigins = env.CORS_ORIGIN?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : false }));
  app.use(express.json());

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/categories', categoryRouter);
  app.use('/tags', tagRouter);
  app.use('/transactions', transactionRouter);
  app.use('/dashboard', dashboardRouter);
  app.use('/accounts', accountRouter);
  app.use('/budgets', budgetRouter);
  app.use('/goals', goalRouter);
  app.use('/docs', helmet({ contentSecurityPolicy: false }), docsRouter);

  app.use(errorMiddleware);

  return app;
}
