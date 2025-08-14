import knex from '../../db/connection.js';
import { Request, Response } from 'express';
import { Tables } from '../../db/tables.js';
import {
	successResponse,
	badRequest,
	unauthorized,
	internalError,
} from '../../utils/error-response.js';
import {
	supabaseCookieName,
	supabaseCookieOptions,
	domainName,
	DEFAULT_PALETTE_COLOR,
} from '../../utils/constants.js';
import { supabase } from '../../db/supabase-client.js';
import { generateUsername } from '../../utils/username-generator.js';
import { getUserSettingsData } from '../../services/user-service.js';
import { logger, logError } from '../../config/logger.js';
import { ValidatedRequest } from '../../utils/validation.js';
import { DEFAULT_INCREMENT } from '../../utils/fractional-indexing/fractional-indexing.js';
import { RegisterData, LoginData } from './authentication-schemas.js';

async function register(req: ValidatedRequest<RegisterData>, res: Response) {
	try {
		const { user_id, email, supabase_refresh_token } = req.validatedBody;

		logger.info('User registration attempt', {
			userId: user_id,
			email,
			hasRefreshToken: !!supabase_refresh_token,
		});

		const { unique } = await isUniqueEmail(email);

		// Return 200 to hide user's account status
		if (!unique && !req.userId) {
			logger.warn('Registration attempt for existing user without authentication', {
				email,
			});
			return successResponse(res, null, 'Registration processed');
		}

		const actualUserId = unique ? user_id : req.userId;

		// New user - create account
		if (unique && !req.userId) {
			await onboardUser(req.validatedBody);
			logger.info('New user registered successfully', {
				userId: actualUserId,
				email,
			});
		}

		// Only set cookies if user has verified email (has refresh token)
		if (supabase_refresh_token) {
			res.cookie(supabaseCookieName, supabase_refresh_token, supabaseCookieOptions);
		}

		return successResponse(res, null, 'Registration successful');
	} catch (err) {
		logError('User registration failed', err, { userId: req.validatedBody?.user_id });
		return internalError(res, 'Registration failed');
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
	const trx = await knex.transaction();
	try {
		await trx(Tables.User).insert({
			user_id,
			email,
			first_name,
			last_name,
		});

		// set up defaults
		const photoUrl = avatar_url || null;
		await createDefaultPack(user_id, trx);
		await createUserSettings(user_id, photoUrl, trx);

		await trx.commit();
	} catch (error) {
		await trx.rollback();
		throw new Error('Failed to create user account');
	}
}

async function login(req: ValidatedRequest<LoginData>, res: Response) {
	const errorText = 'Invaid login information.';
	try {
		const { user_id, email, supabase_refresh_token } = req.validatedBody;

		const initialUser = await knex(Tables.User)
			.select('user_id')
			.where({ user_id, email })
			.first();

		if (initialUser === undefined && !req.userId) return badRequest(res, errorText);

		if (initialUser === undefined && req.userId) {
			await onboardUser(req.validatedBody);
		}

		if (supabase_refresh_token) {
			res.cookie(supabaseCookieName, supabase_refresh_token, supabaseCookieOptions);
		}

		return successResponse(
			res,
			{ newUser: initialUser === undefined },
			'Login successful',
		);
	} catch (err) {
		logError('User login failed', err, { userId: req.validatedBody?.user_id });
		return internalError(res, errorText);
	}
}

async function logout(_req: Request, res: Response) {
	res.clearCookie(supabaseCookieName, { domain: domainName });
	return successResponse(res, null, 'User has been logged out.');
}

async function getAuthStatus(req: Request, res: Response) {
	try {
		const supabaseRefreshToken = req.signedCookies[supabaseCookieName];

		if (!supabaseRefreshToken) {
			return successResponse(res, { isAuthenticated: false });
		}

		try {
			const { data, error } = await supabase.auth.refreshSession({
				refresh_token: supabaseRefreshToken,
			});

			if (error || !data.session || !data.session.user?.id) {
				res.clearCookie(supabaseCookieName, { domain: domainName });
				return successResponse(res, { isAuthenticated: false });
			}

			req.userId = data.session.user.id;

			if (data.session.refresh_token !== supabaseRefreshToken) {
				res.cookie(supabaseCookieName, data.session.refresh_token, supabaseCookieOptions);
			}

			const user = await getUser(req.userId);
			const settings = await getUserSettingsData(req.userId);

			return successResponse(res, {
				isAuthenticated: true,
				user,
				settings,
			});
		} catch (supabaseError) {
			res.clearCookie(supabaseCookieName, { domain: domainName });
			return successResponse(res, { isAuthenticated: false });
		}
	} catch (err) {
		logError('User auth status check failed', err, {
			supabaseRefreshToken: req?.signedCookies[supabaseCookieName],
		});
		return internalError(res, 'There was an error checking your log in status.');
	}
}

export async function getUser(userId: string) {
	return await knex(Tables.User)
		.leftJoin(
			Tables.UserProfile,
			`${Tables.User}.user_id`,
			`${Tables.UserProfile}.user_id`,
		)
		.select(
			'user.user_id',
			'first_name',
			'last_name',
			'email',
			'username',
			'trail_name',
			'profile_photo_url',
		)
		.where(`${Tables.User}.user_id`, userId)
		.first();
}

async function refreshSupabaseSession(req: Request, res: Response) {
	try {
		const refreshToken = req.signedCookies[supabaseCookieName];

		if (!refreshToken) {
			return unauthorized(res, 'No refresh token available');
		}

		const { data, error } = await supabase.auth.refreshSession({
			refresh_token: refreshToken,
		});

		if (error || !data.session) {
			return unauthorized(res, 'Invalid refresh token');
		}

		// Update the refresh token cookie if it changed
		if (data.session.refresh_token !== refreshToken) {
			res.cookie(supabaseCookieName, data.session.refresh_token, supabaseCookieOptions);
		}

		return successResponse(
			res,
			{
				access_token: data.session.access_token,
				expires_at: data.session.expires_at,
			},
			'Session refreshed successfully',
		);
	} catch (err) {
		logError('Refresh user Supabase token failed', err, {
			supabaseRefreshToken: req?.signedCookies[supabaseCookieName],
		});
		return internalError(res, 'Error refreshing session');
	}
}

async function deleteAccount(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { error } = await supabase.auth.admin.deleteUser(userId);

		if (error)
			return internalError(res, 'There was an error deleting your account at this time.');

		await knex(Tables.User).del().where({ user_id: userId });

		res.clearCookie(supabaseCookieName, { domain: domainName });
		return successResponse(res, null, 'User account has been deleted.');
	} catch (err) {
		logError('Delete user account failed', err, { userId: req?.userId });
		return internalError(res, 'There was an error deleting your account.');
	}
}

async function createUserSettings(
	user_id: string,
	profile_photo_url: string | null,
	trx = knex,
) {
	const defaultUsername = generateUsername();

	await trx(Tables.UserSettings).insert({ user_id });

	await trx(Tables.UserProfile).insert({
		user_id,
		profile_photo_url,
		username: defaultUsername,
	});
}

async function createDefaultPack(user_id: string, trx = knex) {
	// Create default pack
	const [{ pack_id }] = await trx(Tables.Pack)
		.insert({
			user_id,
			pack_name: 'Default Pack',
			pack_index: DEFAULT_INCREMENT.toString(),
		})
		.returning('pack_id');

	// Create default category
	const [{ pack_category_id }] = await trx(Tables.PackCategory)
		.insert({
			user_id,
			pack_id,
			pack_category_name: '',
			pack_category_index: DEFAULT_INCREMENT.toString(),
			pack_category_color: DEFAULT_PALETTE_COLOR,
		})
		.returning('pack_category_id');

	// Create default pack item
	await trx(Tables.PackItem).insert({
		user_id,
		pack_id,
		pack_category_id,
		pack_item_name: '',
		pack_item_index: DEFAULT_INCREMENT.toString(),
	});
}

async function isUniqueEmail(email: string) {
	const existingEmail = await knex(Tables.User).select('email').where({ email }).first();
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
	refreshSupabaseSession,
	deleteAccount,
};
