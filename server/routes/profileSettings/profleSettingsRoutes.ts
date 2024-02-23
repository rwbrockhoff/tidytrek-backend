import express from 'express';
import userProfileController from './profileSettingsController.js';
import { s3UploadProfilePhoto } from '../../utils/s3.js';

const router = express.Router();

router.get('/', userProfileController.getProfileSettings);
router.post(
	'/profile-photo',
	s3UploadProfilePhoto.single('profilePhoto'),
	userProfileController.uploadProfilePhoto,
);
router.delete('/profile-photo/', userProfileController.deleteProfilePhoto);

router.put('/', userProfileController.editProfileSettings);
router.post('/social-link', userProfileController.addSocialLink);
router.delete('/social-link/:socialLinkId', userProfileController.deleteSocialLink);

export default router;
