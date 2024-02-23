import express from 'express';
import profileController from './profileController.js';

const router = express.Router();

router.get('/', profileController.getProfile);

export default router;
