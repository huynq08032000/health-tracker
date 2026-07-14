import { Router } from 'express';
import { foodLogsController } from './foodLogs.controller';

const router = Router();

router.get('/:userId/date/:date', foodLogsController.listByDate);
router.get('/:id', foodLogsController.getById);
router.post('/:userId', ...(foodLogsController.create as any));
router.put('/:id', ...(foodLogsController.update as any));
router.delete('/:id', foodLogsController.remove);

export default router;
