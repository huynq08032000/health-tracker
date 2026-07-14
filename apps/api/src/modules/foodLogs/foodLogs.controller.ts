import type { Request, Response } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { CreateFoodLogSchema, UpdateFoodLogSchema } from '@health-tracker/shared';
import { foodLogService } from './foodLogs.service.js';

export const foodLogsController = {
  listByDate: asyncHandler(async (req: Request, res: Response) => {
    res.json(await foodLogService.listByDate(Number(req.params.userId), req.params.date));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await foodLogService.getById(Number(req.params.id)));
  }),

  create: [
    validateBody(CreateFoodLogSchema),
    asyncHandler(async (req: Request, res: Response) => {
      res.status(201).json(await foodLogService.create(Number(req.params.userId), res.locals.validated as any));
    }),
  ],

  update: [
    validateBody(UpdateFoodLogSchema),
    asyncHandler(async (req: Request, res: Response) => {
      res.json(await foodLogService.update(Number(req.params.id), res.locals.validated as any));
    }),
  ],

  remove: asyncHandler(async (req: Request, res: Response) => {
    await foodLogService.remove(Number(req.params.id));
    res.status(204).end();
  }),
};
