import { Router } from 'express';
import { authController } from './auth.controller';

const router = Router();

router.post('/register', ...(authController.register as any));
router.post('/login', ...(authController.login as any));
router.post('/logout', authController.logout);

export default router;
