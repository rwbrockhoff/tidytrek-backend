import knex from '../../db/connection.js';
import { tables as t } from '../../../knexfile.js';
import { Request, Response } from 'express';
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

		return res.status(200).json({ profileInfo, socialLinks });
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error getting your profile settings.' });
	}
}

async function editProfileSettings(
	req: ValidatedRequest<ProfileSettingsUpdate>,
	res: Response,
) {
	try {
		const { userId } = req;

		if (hasEmptyValidatedBody(req)) {
			return res.status(400).json({ error: NO_VALID_FIELDS_MESSAGE });
		}

		const { username } = req.validatedBody;

		if (username) {
			// check for existing username
			const { unique, message } = await isUniqueUsername(username, userId);
			if (!unique) return res.status(409).json({ error: message });
		}

		await knex(t.userProfile).update(req.validatedBody).where({ user_id: userId });

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error updating your profile.' });
	}
}

async function uploadProfilePhoto(req: Request, res: Response) {
	try {
		const { userId } = req;

		if (!req.file) {
			return res
				.status(400)
				.json({ error: 'Please include an image (jpg/png) for your profile.' });
		}

		const profile_photo_url = createCloudfrontUrlForPhoto(
			// @ts-expect-error: key value exists for File type
			req.file?.key,
			'profilePhotoBucket',
		);

		// check for previous photo url
		const { profile_photo_url: prevUrl } = await knex(t.userProfile)
			.select('profile_photo_url')
			.where({ user_id: userId })
			.first();

		if (prevUrl) await s3DeletePhoto(prevUrl);

		await knex(t.userProfile).update({ profile_photo_url }).where({ user_id: userId });

		return res.status(200).send();
	} catch (err) {
		logError('Upload profile avatar photo failed', err, {
			userId: req.userId,
			// @ts-expect-error: key value exists for File type
			file: req.file?.key,
		});
		return res.status(400).json({ error: 'There was an error updating your profile.' });
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
			.update({ profile_photo_url: '' })
			.where({ user_id: userId });

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your photo.' });
	}
}

async function uploadBannerPhoto(req: Request, res: Response) {
	try {
		const { userId } = req;
		if (!req.file) {
			return res
				.status(400)
				.json({ error: 'Please include an image (jpg/png) for your profile.' });
		}

		const banner_photo_url = createCloudfrontUrlForPhoto(
			// @ts-expect-error: key value exists for File type
			req.file?.key,
			'bannerPhotoBucket',
		);

		// check for previous photo url
		const { banner_photo_url: prevUrl } = await knex(t.userProfile)
			.select('banner_photo_url')
			.where({ user_id: userId })
			.first();

		if (prevUrl) await s3DeletePhoto(prevUrl);

		await knex(t.userProfile).update({ banner_photo_url }).where({ user_id: userId });

		return res.status(200).send();
	} catch (err) {
		logError('Upload profile banner photo failed', err, {
			userId: req.userId,
			// @ts-expect-error: key value exists for File type
			file: req.file?.key,
		});
		return res.status(400).json({ error: 'There was an error updating your profile.' });
	}
}

async function updateUsername(req: ValidatedRequest<UsernameUpdate>, res: Response) {
	try {
		const { userId } = req;

		if (hasEmptyValidatedBody(req)) {
			return res.status(400).json({ error: NO_VALID_FIELDS_MESSAGE });
		}

		const { username, trail_name } = req.validatedBody;

		if (username) {
			// check for existing username
			const { unique, message } = await isUniqueUsername(username, userId);
			if (!unique) return res.status(409).json({ error: message });
		}

		await knex(t.userProfile)
			.update({ username: username || null, trail_name })
			.where({ user_id: userId });
		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error saving your username.' });
	}
}

async function generateUsernamePreview(_req: Request, res: Response) {
	try {
		const username = generateUsername();
		return res.status(200).json({ username });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error creating a new username.' });
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

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error adding your link.' });
	}
}

async function deleteSocialLink(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { socialLinkId } = req.params;

		await knex(t.socialLink)
			.del()
			.where({ user_id: userId, social_link_id: socialLinkId });

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your link.' });
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
