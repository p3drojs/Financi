import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { docsRouter } from './modules/docs/docs.routes';
import { healthRouter } from './modules/health/health.routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/docs', helmet({ contentSecurityPolicy: false }), docsRouter);

  app.use(errorMiddleware);

  return app;
}
