import express from 'express';
import userProfileController from './userProfileController.js';

const router = express.Router();

router.get('/', userProfileController.getProfileSettings);

export default router;
