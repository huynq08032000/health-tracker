import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { CreateFoodLogSchema, UpdateFoodLogSchema } from '@health-tracker/shared';
import { foodLogService } from './foodLogs.service.js';

export const foodLogsController = {
  listByDate: (async (req: Request, res: Response) => {
    res.json(await foodLogService.listByDate(Number(req.params.userId), req.params.date));
  }) as RequestHandler,

  getById: (async (req: Request, res: Response) => {
    res.json(await foodLogService.getById(Number(req.params.id)));
  }) as RequestHandler,

  create: [
    validateBody(CreateFoodLogSchema),
    (async (req: Request, res: Response) => {
      res.status(201).json(await foodLogService.create(Number(req.params.userId), res.locals.validated as any));
    }) as RequestHandler,
  ],

  update: [
    validateBody(UpdateFoodLogSchema),
    (async (req: Request, res: Response) => {
      res.json(await foodLogService.update(Number(req.params.id), res.locals.validated as any));
    }) as RequestHandler,
  ],

  remove: (async (req: Request, res: Response) => {
    await foodLogService.remove(Number(req.params.id));
    res.status(204).end();
  }) as RequestHandler,
};
