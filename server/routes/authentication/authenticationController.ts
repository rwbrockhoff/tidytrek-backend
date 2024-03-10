import jwt from 'jsonwebtoken';
import knex from '../../db/connection.js';
import { Request, Response } from 'express';
import { tables as t } from '../../../knexfile.js';
import { cookieName, cookieOptions } from '../../utils/utils.js';
import { supabase } from '../../db/supabaseClient.js';

async function register(req: Request, res: Response) {
	try {
		const { user_id, email, first_name, last_name, avatar_url } = req.body;

		const { unique, message } = await isUniqueEmail(email);
		if (!unique) return res.status(409).json({ error: message });

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

		// add jwt + signed cookie
		const token = createWebToken(user_id);
		res.cookie(cookieName, token, cookieOptions);

		return res.status(200).send();
	} catch (err) {
		res.status(400).json({ error: err });
	}
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

		if (initialUser === undefined)
			return res.status(400).json({ error: 'No account found. Feel free to sign up.' });

		// create token + cookie
		const token = createWebToken(user_id);

		res.cookie(cookieName, token, cookieOptions);

		res.status(200).send();
	} catch (err) {
		res.status(400).json({ error: errorText });
	}
}

async function logout(_req: Request, res: Response) {
	return res.status(200).clearCookie(cookieName).json({
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
	const [settings] = await knex.raw(`
		select us.public_profile, us.topo_background, us.dark_theme, us.weight_unit, 
		theme_info.theme_name, theme_info.theme_colors from user_settings us
			left outer join (
				select th.theme_id, th.theme_name, th.tidytrek_theme, 
				array_agg(to_jsonb(theme_colors)) as theme_colors from theme th
				left outer join 
				(select tc.theme_id, tc.theme_color, tc.theme_color_name from theme_color tc
				) theme_colors on th.theme_id = theme_colors.theme_id
			group by th.theme_id
			) theme_info on us.theme_id = theme_info.theme_id
			where us.user_id = '${userId}' AND us.theme_id = theme_info.theme_id;
	`);
	return settings;
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
	const { themeId } = await knex(t.theme)
		.select('theme_id')
		.where({ tidytrek_theme: true })
		.first();

	await knex(t.userSettings).insert({ user_id, theme_id: themeId });
	await knex(t.userProfile).insert({ user_id, profile_photo_url });
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
				pack_category_name: 'Default Category',
				pack_category_index: 0,
				pack_category_color: 'primary',
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
