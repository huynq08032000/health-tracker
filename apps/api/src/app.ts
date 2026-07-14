import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import usersRoute from './modules/users/users.route';
import dailyLogsRoute from './modules/dailyLogs/dailyLogs.route';
import foodLogsRoute from './modules/foodLogs/foodLogs.route';
import foodsRoute from './modules/foods/foods.route';
import authRoute from './modules/auth/auth.route';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:3000'];

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/users', usersRoute);
  app.use('/api/daily-logs', dailyLogsRoute);
  app.use('/api/food-logs', foodLogsRoute);
  app.use('/api/foods', foodsRoute);
  app.use('/api/auth', authRoute);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
