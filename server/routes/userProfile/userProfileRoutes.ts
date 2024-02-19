import express from 'express';
import userProfileController from './userProfileController.js';

const router = express.Router();

router.get('/', userProfileController.getProfileSettings);
router.put('/', userProfileController.editProfileSettings);
router.post('/social-link', userProfileController.addSocialLink);
router.delete('/social-link/:socialLinkId', userProfileController.deleteSocialLink);

export default router;
