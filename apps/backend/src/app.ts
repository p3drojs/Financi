import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { categoryRouter } from './modules/categories/category.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { docsRouter } from './modules/docs/docs.routes';
import { healthRouter } from './modules/health/health.routes';
import { tagRouter } from './modules/tags/tag.routes';
import { transactionRouter } from './modules/transactions/transaction.routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/categories', categoryRouter);
  app.use('/tags', tagRouter);
  app.use('/transactions', transactionRouter);
  app.use('/dashboard', dashboardRouter);
  app.use('/docs', helmet({ contentSecurityPolicy: false }), docsRouter);

  app.use(errorMiddleware);

  return app;
}
