import { Request, Response, NextFunction as Next } from 'express';
import { getUser } from '../routes/authentication/authentication-controller.js';
import { supabaseCookieName, supabaseCookieOptions } from '../utils/constants.js';
import { supabase } from '../db/supabase-client.js';
import { unauthorized } from '../utils/error-response.js';
import { validateEnvironment } from '../config/environment.js';
import { clearAuthCookie } from '../utils/cookie-utils.js';
import { getCachedUserId, setCachedUserId, deleteCachedUserId } from '../utils/session-cache.js';

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
		const cachedUserId = getCachedUserId(supabaseRefreshToken);
		if (cachedUserId) {
			req.userId = cachedUserId;
			return next();
		}

		const { data: { user }, error: userError } = await supabase.auth.getUser();

		if (user && !userError) {
			req.userId = user.id;
			setCachedUserId(supabaseRefreshToken, user.id);
			return next();
		}

		const { data, error } = await supabase.auth.refreshSession({
			refresh_token: supabaseRefreshToken,
		});

		if (error || !data.session || !data.session.user?.id) {
			deleteCachedUserId(supabaseRefreshToken);
			clearAuthCookie(res);
			return res
				.status(401)
				.json({ error: 'Invalid authentication. Please log in again.' });
		}

		req.userId = data.session.user.id;
		setCachedUserId(data.session.refresh_token, data.session.user.id);

		if (data.session.refresh_token !== supabaseRefreshToken) {
			deleteCachedUserId(supabaseRefreshToken);
			res.cookie(supabaseCookieName, data.session.refresh_token, supabaseCookieOptions);
		}
	} catch (supabaseError) {
		deleteCachedUserId(supabaseRefreshToken);
		clearAuthCookie(res);
		return res
			.status(401)
			.json({ error: 'Authentication validation failed. Please log in again.' });
	}

	next();
};