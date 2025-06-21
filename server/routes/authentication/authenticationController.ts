import jwt from 'jsonwebtoken';
import knex from '../../db/connection.js';
import { Request, Response } from 'express';
import { tables as t } from '../../../knexfile.js';
import { cookieName, cookieOptions, domainName } from '../../utils/utils.js';
import { supabase } from '../../db/supabaseClient.js';
import { generateUsername } from '../../utils/usernameGenerator.js';
import { DEFAULT_PALETTE_COLOR } from '../../utils/constants.js';

async function register(req: Request, res: Response) {
	try {
		const { user_id, email } = req.body;

		const { unique } = await isUniqueEmail(email);

		if (!unique && !req.userId) return res.status(200).send();

		if (!unique && req.userId) {
			// add jwt + signed cookie for supabase verified user
			const token = createWebToken(req.userId);
			res.cookie(cookieName, token, cookieOptions);
			return res.status(200).send();
		}

		await onboardUser(req.body);

		// add jwt + signed cookie
		const token = createWebToken(user_id);
		res.cookie(cookieName, token, cookieOptions);

		return res.status(200).send();
	} catch (err) {
		res.status(400).json({ error: err });
	}
}

async function onboardUser(userInfo: {
	user_id: string;
	email: string;
	first_name?: string;
	last_name?: string;
	avatar_url?: string;
}) {
	const { user_id, email, first_name, last_name, avatar_url } = userInfo;
	await knex(t.user).insert({
		user_id,
		email,
		first_name,
		last_name,
	});

	// set up defaults
	const photoUrl = avatar_url || null;
	await createDefaultPack(user_id);
	await createUserSettings(user_id, photoUrl);
}

async function login(req: Request, res: Response) {
	const errorText = 'Invaid login information.';
	try {
		const { user_id, email } = req.body;
		// if (!req.userId || req.userId !== user_id)
		// 	return res.status(400).json({ error: errorText });

		const initialUser = await knex(t.user)
			.select('user_id')
			.where({ user_id, email })
			.first();

		if (initialUser === undefined && !req.userId)
			return res.status(400).json({ error: errorText });

		if (initialUser === undefined && req.userId) {
			await onboardUser(req.body);
		}

		// create token + cookie
		const token = createWebToken(user_id);
		res.cookie(cookieName, token, cookieOptions);

		res.status(200).json({ newUser: initialUser === undefined });
	} catch (err) {
		res.status(400).json({ error: errorText });
	}
}

async function logout(_req: Request, res: Response) {
	return res.status(200).clearCookie(cookieName, { domain: domainName }).json({
		message: 'User has been logged out.',
	});
}

async function getAuthStatus(req: Request, res: Response) {
	try {
		if (req.user && req.userId) {
			// attach settings
			const settings = await getUserSettings(req.userId);
			res.status(200).json({ isAuthenticated: true, user: req.user, settings });
		} else {
			res.status(200).json({ isAuthenticated: req.userId !== undefined });
		}
	} catch (err) {
		res.status(400).json({ error: 'There was an error checking your log in status.' });
	}
}

export async function getUser(userId: string) {
	return await knex(t.user)
		.leftJoin(t.userProfile, `${t.user}.user_id`, `${t.userProfile}.user_id`)
		.select(
			'user.user_id',
			'first_name',
			'last_name',
			'email',
			'username',
			'trail_name',
			'profile_photo_url',
		)
		.where({ 'user.user_id': userId })
		.first();
}

export async function getUserSettings(userId: string) {
	return await knex(t.userSettings)
		.select('public_profile', 'theme_name', 'dark_mode', 'weight_unit', 'currency_unit')
		.where({ user_id: userId })
		.first();
}

async function deleteAccount(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { error } = await supabase.auth.admin.deleteUser(userId);

		if (error)
			return res
				.status(400)
				.json({ error: 'There was an error deleting your account at this time.' });

		await knex(t.user).del().where({ user_id: userId });

		return res.status(200).clearCookie(cookieName).json({
			message: 'User account has been deleted.',
		});
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your account.' });
	}
}

function createWebToken(userId: string) {
	if (process.env.APP_SECRET) {
		return jwt.sign({ userId }, process.env.APP_SECRET);
	} else {
		return new Error('Invalid app secret when creating JWT.');
	}
}

async function createUserSettings(user_id: string, profile_photo_url: string | null) {
	const defaultUsername = generateUsername();

	await knex(t.userSettings).insert({ user_id });

	await knex(t.userProfile).insert({
		user_id,
		profile_photo_url,
		username: defaultUsername,
	});
}

async function createDefaultPack(userId: string) {
	try {
		const [{ packId }] = await knex(t.pack)
			.insert({
				user_id: userId,
				pack_name: 'Default Pack',
				pack_index: 0,
			})
			.returning('pack_id');

		const [{ packCategoryId }] = await knex(t.packCategory)
			.insert({
				user_id: userId,
				pack_id: packId,
				pack_category_name: '',
				pack_category_index: 0,
				pack_category_color: DEFAULT_PALETTE_COLOR,
			})
			.returning('pack_category_id');

		await knex(t.packItem).insert({
			user_id: userId,
			pack_id: packId,
			pack_category_id: packCategoryId,
			pack_item_name: '',
			pack_item_index: 0,
		});
	} catch (err) {
		return new Error('Error creating default pack for user');
	}
}

async function isUniqueEmail(email: string) {
	const existingEmail = await knex(t.user).select('email').where({ email }).first();
	if (existingEmail) {
		return {
			unique: false,
			message: 'Account is already registered. Please log in.',
		};
	}
	return { unique: true };
}

export default {
	register,
	login,
	logout,
	getAuthStatus,
	deleteAccount,
};
