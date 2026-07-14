import { Router } from 'express';
import { authController } from './auth.controller.js';

const router = Router();

router.post('/register', ...(authController.register as any));
router.post('/login', ...(authController.login as any));
router.post('/logout', authController.logout);

export default router;
