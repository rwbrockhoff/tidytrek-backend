import express from 'express';
import authenticationController from './authenticationController.js';

const router = express.Router();

router.get('/status', authenticationController.getAuthStatus);
router.post('/register', authenticationController.register);
router.post('/login', authenticationController.login);
router.post('/logout', authenticationController.logout);
router.put('/password', authenticationController.changePassword);
router.post('/reset-password/request', authenticationController.requestResetPassword);
router.post('/reset-password/confirm', authenticationController.confirmResetPassword);
router.delete('/account', authenticationController.deleteAccount);

export default router;
