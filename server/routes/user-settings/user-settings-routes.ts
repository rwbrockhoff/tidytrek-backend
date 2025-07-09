import express from 'express';
import userSettingsController from './user-settings-controller.js';

const router = express.Router();

// Update user settings
router.put('/', userSettingsController.updateUserSettings);

export default router;
