import express from 'express';
import authenticationController from './authenticationController.js';
import { authRateLimit } from '../../config/rateLimiting.js';

const router = express.Router();

router.get('/status', authenticationController.getAuthStatus);
router.post('/register', authRateLimit, authenticationController.register);
router.post('/login', authRateLimit, authenticationController.login);
router.post('/logout', authenticationController.logout);
router.post('/refresh', authenticationController.refreshSupabaseSession);
router.delete('/account', authenticationController.deleteAccount);

export default router;
