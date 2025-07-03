import express from 'express';
import userSettingsController from './userSettingsController.js';

const router = express.Router();

// Update user settings
router.put('/', userSettingsController.updateUserSettings);

export default router;
