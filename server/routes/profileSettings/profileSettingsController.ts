import knex from '../../db/connection.js';
import { tables as t } from '../../../knexfile.js';
import { Request, Response } from 'express';
import {
	createProfilePhotoUrlForCloudfront,
	deleteProfilePhotoFromS3,
} from '../../utils/s3.js';

const linkListId = 'social_link_list_id';

async function getProfileSettings(req: Request, res: Response) {
	try {
		const { userId } = req;

		const { profileSettings, socialLinks } = await getUserProfileInfo(userId);

		return res.status(200).json({ profileSettings, socialLinks });
	} catch (err) {
		return res
			.status(400)
			.json({ error: 'There was an error getting your profile settings.' });
	}
}

export const getUserProfileInfo = async (userId: number) => {
	const profileSettings =
		(await knex(t.userProfile).where({ user_id: userId }).first()) || {};

	const socialLinks = await knex(t.socialLinkList)
		.leftOuterJoin(
			t.socialLink,
			`${t.socialLinkList}.${linkListId}`,
			`${t.socialLink}.${linkListId}`,
		)
		.where({ user_id: userId });

	const user = await knex(t.user)
		.select('first_name', 'username', 'user_id')
		.where({ user_id: userId })
		.first();

	return { profileSettings, socialLinks, user };
};

async function editProfileSettings(req: Request, res: Response) {
	try {
		const { userId } = req;
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
		// @ts-expect-error: key value exists for File type
		const profile_photo_url = createProfilePhotoUrlForCloudfront(req.file?.key);

		// check for previous photo url
		const { profilePhotoUrl: prevUrl } = await knex(t.userProfile)
			.select('profile_photo_url')
			.where({ user_id: userId })
			.first();

		if (prevUrl) await deleteProfilePhotoFromS3(prevUrl);

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
		await deleteProfilePhotoFromS3(profilePhotoUrl);

		// delete from DB
		await knex(t.userProfile)
			.update({ profile_photo_url: '' })
			.where({ user_id: userId });

		return res.status(200).send();
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your photo.' });
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
	addSocialLink,
	deleteSocialLink,
};
