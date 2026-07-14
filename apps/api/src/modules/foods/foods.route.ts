import { Router } from 'express';
import { foodsController } from './foods.controller';

const router = Router();

router.get('/', foodsController.search);
router.get('/:id', foodsController.getById);
router.post('/', ...(foodsController.create as any));

export default router;
