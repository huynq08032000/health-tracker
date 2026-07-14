import type { Request, Response, RequestHandler } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { CreateFoodSchema } from '@health-tracker/shared';
import { foodService } from './foods.service.js';

export const foodsController = {
  search: (async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    res.json(await foodService.search(q));
  }) as RequestHandler,

  getById: (async (req: Request, res: Response) => {
    res.json(await foodService.getById(Number(req.params.id)));
  }) as RequestHandler,

  create: [
    validateBody(CreateFoodSchema),
    (async (_req: Request, res: Response) => {
      res.status(201).json(await foodService.create(res.locals.validated as any));
    }) as RequestHandler,
  ],
};
