import snakeCaseKeys from 'snakecase-keys';
import camelCaseKeys from 'camelcase-keys';
import { Request, Response, NextFunction as Next } from 'express';
import { getUser } from '../routes/authentication/authentication-controller.js';
import { supabaseCookieName, supabaseCookieOptions } from './constants.js';
import { supabase } from '../db/supabase-client.js';
import { unauthorized } from './error-response.js';
import { validateEnvironment } from '../config/environment.js';

const env = validateEnvironment();

export const attachUserToRequest = async (req: Request, _res: Response, next: Next) => {
	if (!req.userId) return next();

	const user = await getUser(req.userId);
	if (user) req.user = user;

	next();
};

export const protectedRoute = async (req: Request, res: Response, next: Next) => {
	if (env.NODE_ENV === 'test') {
		if (!req.userId) {
			return unauthorized(res);
		}
		return next();
	}

	const supabaseRefreshToken = req.signedCookies[supabaseCookieName];
	if (!supabaseRefreshToken) {
		return unauthorized(res);
	}

	try {
		const { data, error } = await supabase.auth.refreshSession({
			refresh_token: supabaseRefreshToken,
		});

		if (error || !data.session || !data.session.user?.id) {
			return res
				.status(401)
				.json({ error: 'Invalid authentication. Please log in again.' });
		}

		req.userId = data.session.user.id;

		if (data.session.refresh_token !== supabaseRefreshToken) {
			res.cookie(supabaseCookieName, data.session.refresh_token, supabaseCookieOptions);
		}
	} catch (supabaseError) {
		return res
			.status(401)
			.json({ error: 'Authentication validation failed. Please log in again.' });
	}

	next();
};

export const convertRequestToSnakeCase = (req: Request, _res: Response, next: Next) => {
	if (req.body) {
		const snakeCaseBody = snakeCaseKeys(req.body);
		req.body = snakeCaseBody;
	}
	next();
};

export const convertResponseToCamelCase = (_req: Request, res: Response, next: Next) => {
	const originalJson = res.json;

	res.json = function (body) {
		if (body && typeof body === 'object') {
			const camelCaseBody = camelCaseKeys(body, { deep: true });
			return originalJson.call(this, camelCaseBody);
		}
		return originalJson.call(this, body);
	};

	next();
};
