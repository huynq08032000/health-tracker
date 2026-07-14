import { Router } from 'express';
import { usersController } from './users.controller';

const router = Router();

router.get('/', usersController.list);
router.get('/username/:username', usersController.getByUsername);
router.get('/:id', usersController.getById);
router.post('/', ...(usersController.create as any));
router.put('/:id', ...(usersController.update as any));
router.delete('/:id', usersController.remove);

export default router;
