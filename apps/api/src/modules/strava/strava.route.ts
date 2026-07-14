import { Router } from 'express';
import { stravaController } from './strava.controller.js';

const router = Router();

router.get('/authorize', stravaController.authorize);
router.get('/callback', stravaController.callback);
router.get('/:userId/status', stravaController.status);
router.delete('/:userId', stravaController.disconnect);
router.post('/:userId/sync', stravaController.sync);

export default router;
