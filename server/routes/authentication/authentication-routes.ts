import express from 'express';
import authenticationController from './authentication-controller.js';
import { authRateLimit } from '../../config/rate-limiting.js';

const router = express.Router();

router.get('/status', authenticationController.getAuthStatus);
router.post('/register', authRateLimit, authenticationController.register);
router.post('/login', authRateLimit, authenticationController.login);
router.post('/logout', authenticationController.logout);
router.post('/refresh', authenticationController.refreshSupabaseSession);
router.delete('/account', authenticationController.deleteAccount);

export default router;
