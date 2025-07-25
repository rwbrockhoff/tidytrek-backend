import knex from '../../db/connection.js';
import { tables as t } from '../../../knexfile.js';
import { Request, Response } from 'express';
import { MulterS3File } from '../../types/multer.js';
import {
	errorResponse,
	successResponse,
	badRequest,
	conflict,
	internalError,
	HTTP_STATUS,
	ErrorCode,
} from '../../utils/error-response.js';
import { createCloudfrontUrlForPhoto, s3DeletePhoto } from '../../utils/s3.js';
import { generateUsername } from '../../utils/username-generator.js';
import { logError } from '../../config/logger.js';
import { getUserProfileInfo } from '../../services/profile-service.js';
import {
	hasEmptyValidatedBody,
	NO_VALID_FIELDS_MESSAGE,
	ValidatedRequest,
} from '../../utils/validation.js';
import {
	ProfileSettingsUpdate,
	UsernameUpdate,
	SocialLinkCreate,
} from './profile-settings-schemas.js';

async function getProfileSettings(req: Request, res: Response) {
	try {
		const { userId } = req;

		const { profileInfo, socialLinks } = await getUserProfileInfo(userId);

		return successResponse(res, { profileInfo, socialLinks });
	} catch (err) {
		logError('Get profile settings failed', err, { userId: req.userId });
		return internalError(res, 'There was an error getting your profile settings.');
	}
}

async function editProfileSettings(
	req: ValidatedRequest<ProfileSettingsUpdate>,
	res: Response,
) {
	try {
		const { userId } = req;

		if (hasEmptyValidatedBody(req)) {
			return badRequest(res, NO_VALID_FIELDS_MESSAGE);
		}

		const { username } = req.validatedBody;

		if (username) {
			// check for existing username
			const result = await isUniqueUsername(username, userId);
			if (!result.unique) return conflict(res, result.message || 'Username is not available');
		}

		await knex(t.userProfile).update(req.validatedBody).where({ user_id: userId });

		return successResponse(res, null, 'Profile updated successfully');
	} catch (err) {
		logError('Edit profile settings failed', err, { userId: req.userId });
		return internalError(res, 'There was an error updating your profile.');
	}
}

async function uploadProfilePhoto(req: Request, res: Response) {
	try {
		const { userId } = req;

		if (!req.file) {
			return badRequest(res, 'Please include an image (jpg/png) for your profile.', {
				code: ErrorCode.FILE_UPLOAD_ERROR,
			});
		}

		const s3Key = (req.file as MulterS3File)?.key;
		const defaultPosition = { x: 0, y: 0, zoom: 1.0 };
		const profile_photo_url = createCloudfrontUrlForPhoto(
			s3Key,
			'profilePhotoBucket',
		);

		// check for previous photo url
		const { profile_photo_url: prevUrl } = await knex(t.userProfile)
			.select('profile_photo_url')
			.where({ user_id: userId })
			.first();

		if (prevUrl) await s3DeletePhoto(prevUrl);

		await knex(t.userProfile).update({
			profile_photo_url,
			profile_photo_s3_key: s3Key,
			profile_photo_position: defaultPosition
		}).where({ user_id: userId });

		return successResponse(res, null, 'Profile photo uploaded successfully');
	} catch (err) {
		logError('Upload profile avatar photo failed', err, {
			userId: req.userId,
			file: (req.file as MulterS3File)?.key,
		});
		return errorResponse(
			res,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			'There was an error uploading your profile photo.',
			ErrorCode.FILE_UPLOAD_ERROR
		);
	}
}

async function deleteProfilePhoto(req: Request, res: Response) {
	try {
		const { userId } = req;

		const { profile_photo_url } = await knex(t.userProfile)
			.select('profile_photo_url')
			.where({ user_id: userId })
			.first();

		// delete from S3
		await s3DeletePhoto(profile_photo_url);

		// delete from DB
		await knex(t.userProfile)
			.update({
				profile_photo_url: null,
				profile_photo_s3_key: null,
				profile_photo_position: null
			})
			.where({ user_id: userId });

		return successResponse(res, null, 'Profile photo deleted successfully');
	} catch (err) {
		return internalError(res, 'There was an error deleting your photo.');
	}
}

async function uploadBannerPhoto(req: Request, res: Response) {
	try {
		const { userId } = req;
		if (!req.file) {
			return badRequest(res, 'Please include an image (jpg/png) for your profile.');
		}

		const s3Key = (req.file as MulterS3File)?.key;
		const defaultPosition = { x: 0, y: 0, zoom: 1.0 };
		const banner_photo_url = createCloudfrontUrlForPhoto(
			s3Key,
			'bannerPhotoBucket',
		);

		// check for previous photo url
		const { banner_photo_url: prevUrl } = await knex(t.userProfile)
			.select('banner_photo_url')
			.where({ user_id: userId })
			.first();

		if (prevUrl) await s3DeletePhoto(prevUrl);

		await knex(t.userProfile).update({
			banner_photo_url,
			banner_photo_s3_key: s3Key,
			banner_photo_position: defaultPosition
		}).where({ user_id: userId });

		return successResponse(res, null, 'Banner photo uploaded successfully');
	} catch (err) {
		logError('Upload profile banner photo failed', err, {
			userId: req.userId,
			// @ts-expect-error: key value exists for File type
			file: req.file?.key,
		});
		return internalError(res, 'There was an error updating your profile.');
	}
}

async function updateUsername(req: ValidatedRequest<UsernameUpdate>, res: Response) {
	try {
		const { userId } = req;

		if (hasEmptyValidatedBody(req)) {
			return badRequest(res, NO_VALID_FIELDS_MESSAGE);
		}

		const { username, trail_name } = req.validatedBody;

		if (username) {
			// check for existing username
			const result = await isUniqueUsername(username, userId);
			if (!result.unique) return conflict(res, result.message || 'Username is not available');
		}

		await knex(t.userProfile)
			.update({ username: username || null, trail_name })
			.where({ user_id: userId });
		return successResponse(res, null, 'Username updated successfully');
	} catch (err) {
		return internalError(res, 'There was an error saving your username.');
	}
}

async function generateUsernamePreview(_req: Request, res: Response) {
	try {
		const username = generateUsername();
		return successResponse(res, { username });
	} catch (err) {
		return internalError(res, 'There was an error creating a new username.');
	}
}

async function addSocialLink(req: ValidatedRequest<SocialLinkCreate>, res: Response) {
	try {
		const { userId } = req;
		const { social_link_url } = req.validatedBody;

		// Check if user has hit social link limit
		const countResponse = await knex(t.socialLink)
			.count()
			.where({ user_id: userId })
			.first();

		if (countResponse && Number(countResponse.count) >= 4) {
			return res
				.status(400)
				.json({ error: 'You already have four links in your profile' });
		}

		await knex(t.socialLink).insert({
			user_id: userId,
			social_link_url,
		});

		return successResponse(res, null, 'Social link added successfully');
	} catch (err) {
		return internalError(res, 'There was an error adding your link.');
	}
}

async function deleteSocialLink(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { socialLinkId } = req.params;

		await knex(t.socialLink)
			.del()
			.where({ user_id: userId, social_link_id: socialLinkId });

		return successResponse(res, null, 'Social link deleted successfully');
	} catch (err) {
		return internalError(res, 'There was an error deleting your link.');
	}
}

async function isUniqueUsername(username: string, userId: string) {
	if (username && username.length) {
		const existingUsername = await knex(t.userProfile)
			.select('username')
			.whereNot('user_id', '=', userId)
			.andWhere({ username })
			.first();

		if (existingUsername)
			return {
				unique: false,
				message: 'That username is already taken. Good choice but try again!',
			};
	}
	return { unique: true };
}

export default {
	getProfileSettings,
	editProfileSettings,
	uploadProfilePhoto,
	deleteProfilePhoto,
	uploadBannerPhoto,
	updateUsername,
	generateUsernamePreview,
	addSocialLink,
	deleteSocialLink,
};
