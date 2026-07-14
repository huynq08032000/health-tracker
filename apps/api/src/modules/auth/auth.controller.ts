import type { Request, Response } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  RegisterSchema,
  LoginSchema,
} from '@health-tracker/shared';
import { authService } from './auth.service.js';

export const authController = {
  register: [
    validateBody(RegisterSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await authService.register(req.body as any);
      res.status(201).json(result);
    }),
  ],

  login: [
    validateBody(LoginSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await authService.login(req.body as any);
      res.json(result);
    }),
  ],

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.slice(7);
    if (token) await authService.logout(token);
    res.status(204).end();
  }),
};
