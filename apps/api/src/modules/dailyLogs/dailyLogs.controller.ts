import type { Request, Response } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { UpsertDailyLogSchema } from '@health-tracker/shared';
import { dailyLogService } from './dailyLogs.service.js';

export const dailyLogsController = {
  getByDate: asyncHandler(async (req: Request, res: Response) => {
    res.json(await dailyLogService.getByDate(Number(req.params.userId), req.params.date));
  }),

  range: asyncHandler(async (req: Request, res: Response) => {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    if (!from || !to) {
      res.status(400).json({ error: 'from and to query params are required (YYYY-MM-DD)' });
      return;
    }
    res.json(await dailyLogService.range(Number(req.params.userId), from, to));
  }),

  upsert: [
    validateBody(UpsertDailyLogSchema),
    asyncHandler(async (req: Request, res: Response) => {
      res.json(await dailyLogService.upsert(Number(req.params.userId), res.locals.validated as any));
    }),
  ],

  update: [
    validateBody(UpsertDailyLogSchema),
    asyncHandler(async (req: Request, res: Response) => {
      res.json(await dailyLogService.update(Number(req.params.id), res.locals.validated as any));
    }),
  ],
};
