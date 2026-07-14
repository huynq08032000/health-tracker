import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { stravaService } from './strava.service.js';
import { StravaSyncResult } from '@health-tracker/shared';

export const stravaController = {
  authorize: asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.query.userId);
    if (!userId) {
      res.status(400).json({ error: 'userId query param is required' });
      return;
    }
    const url = await stravaService.getAuthorizationUrl(userId);
    res.json({ url });
  }),

  callback: asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = req.query;
    if (!code || !state) {
      res.status(400).json({ error: 'Missing code or state' });
      return;
    }
    await stravaService.handleCallback(code as string, state as string);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/daily?strava=connected`);
  }),

  status: asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const status = await stravaService.getStatus(userId);
    res.json(status);
  }),

  disconnect: asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    await stravaService.disconnect(userId);
    res.status(204).end();
  }),

  sync: asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const result: StravaSyncResult = await stravaService.syncActivities(userId);
    res.json(result);
  }),
};
