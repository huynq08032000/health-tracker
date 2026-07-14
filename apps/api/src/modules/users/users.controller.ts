import type { Request, Response, NextFunction } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  CreateUserSchema,
  UpdateUserSchema,
} from '@health-tracker/shared';
import { userService } from './users.service.js';

export const usersController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await userService.list());
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await userService.getById(Number(req.params.id)));
  }),

  getByUsername: asyncHandler(async (req: Request, res: Response) => {
    res.json(await userService.getByUsername(req.params.username));
  }),

  create: [
    validateBody(CreateUserSchema),
    asyncHandler(async (_req: Request, res: Response) => {
      res.status(201).json(await userService.create(res.locals.validated as any));
    }),
  ],

  update: [
    validateBody(UpdateUserSchema),
    asyncHandler(async (req: Request, res: Response) => {
      res.json(await userService.update(Number(req.params.id), res.locals.validated as any));
    }),
  ],

  remove: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.remove(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      next(err instanceof HttpError ? err : new Error(String(err)));
    }
  }),
};
