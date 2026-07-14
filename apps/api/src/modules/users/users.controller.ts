import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { validateBody } from '../../middleware/validate';
import { HttpError } from '../../middleware/errorHandler';
import {
  CreateUserSchema,
  UpdateUserSchema,
} from '@health-tracker/shared';
import { userService } from './users.service';

const ok: RequestHandler = (_req, res) => res.json({ ok: true });

export const usersController = {
  list: (async (_req: Request, res: Response) => {
    res.json(await userService.list());
  }) as RequestHandler,

  getById: (async (req: Request, res: Response) => {
    res.json(await userService.getById(Number(req.params.id)));
  }) as RequestHandler,

  getByUsername: (async (req: Request, res: Response) => {
    res.json(await userService.getByUsername(req.params.username));
  }) as RequestHandler,

  create: [
    validateBody(CreateUserSchema),
    (async (_req: Request, res: Response) => {
      res.status(201).json(await userService.create(res.locals.validated as any));
    }) as RequestHandler,
  ],

  update: [
    validateBody(UpdateUserSchema),
    (async (req: Request, res: Response) => {
      res.json(await userService.update(Number(req.params.id), res.locals.validated as any));
    }) as RequestHandler,
  ],

  remove: (async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.remove(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      next(err instanceof HttpError ? err : new Error(String(err)));
    }
  }) as RequestHandler,
};
