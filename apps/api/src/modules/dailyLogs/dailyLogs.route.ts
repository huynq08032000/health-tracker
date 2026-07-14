import { Router } from 'express';
import { dailyLogsController } from './dailyLogs.controller';

const router = Router();

router.get('/:userId/date/:date', dailyLogsController.getByDate);
router.get('/:userId/range', dailyLogsController.range);
router.post('/:userId', ...(dailyLogsController.upsert as any));
router.put('/:id', ...(dailyLogsController.update as any));

export default router;
