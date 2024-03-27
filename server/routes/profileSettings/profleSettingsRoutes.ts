import express from 'express';
import userProfileController from './profileSettingsController.js';
import { s3UploadPhoto } from '../../utils/s3.js';

const router = express.Router();

router.get('/', userProfileController.getProfileSettings);
router.get('/random-username', userProfileController.generateUsernamePreview);

router.post('/social-link', userProfileController.addSocialLink);
router.post(
	'/profile-photo',
	s3UploadPhoto('profilePhotoBucket').single('profilePhoto'),
	userProfileController.uploadProfilePhoto,
);
router.post(
	'/banner-photo',
	s3UploadPhoto('bannerPhotoBucket').single('bannerPhoto'),
	userProfileController.uploadBannerPhoto,
);

router.put('/username', userProfileController.updateUsername);
router.put('/', userProfileController.editProfileSettings);

router.delete('/social-link/:socialLinkId', userProfileController.deleteSocialLink);
router.delete('/profile-photo/', userProfileController.deleteProfilePhoto);

export default router;
