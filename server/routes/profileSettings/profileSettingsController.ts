import knex from '../../db/connection.js';
import { tables as t } from '../../../knexfile.js';
import { Request, Response } from 'express';
import {
	createProfilePhotoUrlForCloudfront,
	createBannerPhotoUrlForCloudfront,
	deletePhotoFromS3,
} from '../../utils/s3.js';

const linkListId = 'social_link_list_id';

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

export const getUserProfileInfo = async (userId: number) => {
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
		.where({ 'user.user_id': userId })
		.first();

	const socialLinks = await knex(t.socialLinkList)
		.leftOuterJoin(
			t.socialLink,
			`${t.socialLinkList}.${linkListId}`,
			`${t.socialLink}.${linkListId}`,
		)
		.where({ user_id: userId });

	return { profileInfo, socialLinks };
};

async function editProfileSettings(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { username } = req.body;

		if (username) {
			// username must be unique
			const { username: existingUsername, userId: existingUser } =
				(await knex(t.userProfile)
					.select('username', 'user_id')
					.where({ username })
					.first()) || {};
			if (existingUsername && userId !== existingUser) {
				return res.status(409).json({ error: 'This username is already in use.' });
			}
		}

		await knex(t.userProfile)
			.update({ ...req.body })
			.where({ user_id: userId });

		return res.status(200).send();
	} catch (err) {
		console.log('err: ', err);
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
		// @ts-expect-error: key value exists for File type
		const profile_photo_url = createProfilePhotoUrlForCloudfront(req.file?.key);

		// check for previous photo url
		const { profilePhotoUrl: prevUrl } = await knex(t.userProfile)
			.select('profile_photo_url')
			.where({ user_id: userId })
			.first();

		if (prevUrl) await deletePhotoFromS3(prevUrl);

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
		await deletePhotoFromS3(profilePhotoUrl);

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
		// @ts-expect-error: key value exists for File type
		const banner_photo_url = createBannerPhotoUrlForCloudfront(req.file?.key);

		// check for previous photo url
		const { bannerPhotoUrl: prevUrl } = await knex(t.userProfile)
			.select('banner_photo_url')
			.where({ user_id: userId })
			.first();

		if (prevUrl) await deletePhotoFromS3(prevUrl);

		await knex(t.userProfile).update({ banner_photo_url }).where({ user_id: userId });

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error updating your profile.' });
	}
}

async function addSocialLink(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { service, social_link } = req.body;

		const { socialLinkListId } = await knex(t.socialLinkList)
			.select('social_link_list_id')
			.where({ social_link_name: service })
			.first();

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
			social_link_url: social_link,
			social_link_list_id: socialLinkListId,
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

export default {
	getProfileSettings,
	editProfileSettings,
	uploadProfilePhoto,
	deleteProfilePhoto,
	uploadBannerPhoto,
	addSocialLink,
	deleteSocialLink,
};
