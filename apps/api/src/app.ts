import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import usersRoute from './modules/users/users.route.js';
import dailyLogsRoute from './modules/dailyLogs/dailyLogs.route.js';
import foodLogsRoute from './modules/foodLogs/foodLogs.route.js';
import foodsRoute from './modules/foods/foods.route.js';
import authRoute from './modules/auth/auth.route.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

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
