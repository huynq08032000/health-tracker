import type { Request, Response } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { CreateFoodSchema } from '@health-tracker/shared';
import { foodService } from './foods.service.js';

export const foodsController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    res.json(await foodService.search(q));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await foodService.getById(Number(req.params.id)));
  }),

  create: [
    validateBody(CreateFoodSchema),
    asyncHandler(async (_req: Request, res: Response) => {
      res.status(201).json(await foodService.create(res.locals.validated as any));
    }),
  ],
};
