import express from 'express';
import controller from './user-settings-controller.js';
import { validateRequestBody as validate, withTypes } from '../../utils/validation.js';
import { UserSettingsUpdateSchema, UserSettingsUpdate } from './user-settings-schemas.js';

const router = express.Router();

// Update user settings
router.put('/', validate(UserSettingsUpdateSchema), withTypes<UserSettingsUpdate>(controller.updateUserSettings));

export default router;
