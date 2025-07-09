import express from 'express';
import profileController from './profile-controller.js';

const router = express.Router();

router.get('/', profileController.getProfile);

export default router;
