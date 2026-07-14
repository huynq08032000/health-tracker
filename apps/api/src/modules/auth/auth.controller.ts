import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { HttpError } from '../../middleware/errorHandler.js';
import {
  RegisterSchema,
  LoginSchema,
  AuthResponseSchema,
} from '@health-tracker/shared';
import { authService } from './auth.service.js';

export const authController = {
  register: [
    validateBody(RegisterSchema),
    (async (req: Request, res: Response) => {
      const result = await authService.register(req.body as any);
      res.status(201).json(result);
    }) as RequestHandler,
  ],

  login: [
    validateBody(LoginSchema),
    (async (req: Request, res: Response) => {
      const result = await authService.login(req.body as any);
      res.json(result);
    }) as RequestHandler,
  ],

  logout: (async (req: Request, res: Response) => {
    const token = req.headers.authorization?.slice(7);
    if (token) await authService.logout(token);
    res.status(204).end();
  }) as RequestHandler,
};
