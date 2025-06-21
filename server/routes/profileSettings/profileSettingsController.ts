import knex from '../../db/connection.js';
import { tables as t } from '../../../knexfile.js';
import { Request, Response } from 'express';
import { createCloudfrontUrlForPhoto, s3DeletePhoto } from '../../utils/s3.js';
import { generateUsername } from '../../utils/usernameGenerator.js';

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

export const getUserProfileInfo = async (userId: string) => {
	const profileInfo = await knex(t.user)
		.leftJoin(t.userProfile, `${t.user}.user_id`, `${t.userProfile}.user_id`)
		.select(
			'first_name',
			'trail_name',
			'username',
			'profile_photo_url',
			'banner_photo_url',
			'user_bio',
			'user_location',
		)
		.where({ [`${t.user}.user_id`]: userId })
		.first();

	const socialLinks = await knex(t.socialLink)
		.select('social_link_id', 'platform_name', 'social_link_url')
		.where({ user_id: userId });

	return { profileInfo, socialLinks };
};

async function editProfileSettings(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { username } = req.body;

		if (username) {
			// check for existing username
			const { unique, message } = await isUniqueUsername(username, userId);
			if (!unique) return res.status(409).json({ error: message });
		}

		await knex(t.userProfile)
			.update({ ...req.body })
			.where({ user_id: userId });

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
		const { profilePhotoUrl: prevUrl } = await knex(t.userProfile)
			.select('profile_photo_url')
			.where({ user_id: userId })
			.first();

		if (prevUrl) await s3DeletePhoto(prevUrl);

		await knex(t.userProfile).update({ profile_photo_url }).where({ user_id: userId });

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error updating your profile.' });
	}
}

async function deleteProfilePhoto(req: Request, res: Response) {
	try {
		const { userId } = req;

		const { profilePhotoUrl } = await knex(t.userProfile)
			.select('profile_photo_url')
			.where({ user_id: userId })
			.first();

		// delete from S3
		await s3DeletePhoto(profilePhotoUrl);

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
		const { bannerPhotoUrl: prevUrl } = await knex(t.userProfile)
			.select('banner_photo_url')
			.where({ user_id: userId })
			.first();

		if (prevUrl) await s3DeletePhoto(prevUrl);

		await knex(t.userProfile).update({ banner_photo_url }).where({ user_id: userId });

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error updating your profile.' });
	}
}

async function updateUsername(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { username, trail_name } = req.body;

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

async function addSocialLink(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { platform_name, social_link_url } = req.body;

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
			platform_name,
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
