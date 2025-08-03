import express from 'express';
import controller from './profile-settings-controller.js';
import { s3UploadPhoto } from '../../utils/s3.js';
import { uploadRateLimit } from '../../config/rate-limiting.js';
import { validateRequestBody as validate, withTypes } from '../../utils/validation.js';
import { 
	ProfileSettingsUpdateSchema, 
	UsernameUpdateSchema, 
	SocialLinkCreateSchema,
	ProfileSettingsUpdate, 
	UsernameUpdate, 
	SocialLinkCreate 
} from './profile-settings-schemas.js';

const router = express.Router();

router.get('/', controller.getProfileSettings);
router.get('/random-username', controller.generateUsernamePreview);

router.post('/social-link', validate(SocialLinkCreateSchema), withTypes<SocialLinkCreate>(controller.addSocialLink));
router.post(
	'/profile-photo',
	uploadRateLimit,
	s3UploadPhoto('profilePhotoBucket').single('profilePhoto'),
	controller.uploadProfilePhoto,
);
router.post(
	'/banner-photo',
	uploadRateLimit,
	s3UploadPhoto('bannerPhotoBucket').single('bannerPhoto'),
	controller.uploadBannerPhoto,
);

router.put('/username', validate(UsernameUpdateSchema), withTypes<UsernameUpdate>(controller.updateUsername));
router.put('/', validate(ProfileSettingsUpdateSchema), withTypes<ProfileSettingsUpdate>(controller.editProfileSettings));

router.delete('/social-link/:socialLinkId', controller.deleteSocialLink);
router.delete('/profile-photo/', controller.deleteProfilePhoto);

export default router;
