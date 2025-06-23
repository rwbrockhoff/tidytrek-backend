import jwt from 'jsonwebtoken';
import snakeCaseKeys from 'snakecase-keys';
import camelCaseKeys from 'camelcase-keys';
import { Request, Response, NextFunction as Next } from 'express';
import { getUser } from '../routes/authentication/authenticationController.js';
import { cookieName, supabaseCookieName, cookieOptions } from './utils.js';
import { supabase } from '../db/supabaseClient.js';

type JwtPayload = { userId: string; iat?: number };
type SupabaseJwtPayload = { sub: string; iat?: number };

// JWT verification
const verifyJwtToken = (token: string, secret: string): JwtPayload | null => {
	try {
		return jwt.verify(token, secret) as JwtPayload;
	} catch {
		return null;
	}
};

// Supabase JWT verification
const verifySupabaseToken = (
	token: string,
	secret: string,
): SupabaseJwtPayload | null => {
	try {
		return jwt.verify(token, secret) as SupabaseJwtPayload;
	} catch {
		return null;
	}
};

// Extract userId from different token sources
const extractUserId = (req: Request): string | null => {
	// Try app cookie token first
	const cookieToken = req.signedCookies[cookieName];
	if (cookieToken && process.env.APP_SECRET) {
		const payload = verifyJwtToken(cookieToken, process.env.APP_SECRET);
		if (payload?.userId) return payload.userId;
	}

	// Try Supabase cookie token
	const supabaseCookieToken = req.signedCookies[supabaseCookieName];
	if (supabaseCookieToken && process.env.SUPABASE_KEY) {
		const payload = verifySupabaseToken(supabaseCookieToken, process.env.SUPABASE_KEY);
		if (payload?.sub) return payload.sub;
	}

	// Fallback: check header (Supabase format)
	const authHeader = req.headers['authorization'];
	if (authHeader) {
		const parts = authHeader.split(' ');
		if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
			const token = parts[1];
			if (token && process.env.SUPABASE_KEY) {
				const payload = verifySupabaseToken(token, process.env.SUPABASE_KEY);
				if (payload?.sub) return payload.sub;
			}
		}
	}

	return null;
};

export const getUserId = async (req: Request, _res: Response, next: Next) => {
	const userId = extractUserId(req);
	if (userId) req.userId = userId;
	next();
};

export const attachCookie = (req: Request, res: Response, next: Next) => {
	const token = req.signedCookies[cookieName];

	if (token && process.env.APP_SECRET) {
		const decoded = verifyJwtToken(token, process.env.APP_SECRET);

		if (decoded?.userId) {
			req.cookie = decoded.userId;

			// Rolling expiration: refresh JWT cookie if more than halfway to expiration
			if (decoded.iat && cookieOptions.maxAge) {
				const now = Math.floor(Date.now() / 1000);
				const tokenAge = now - decoded.iat;
				const maxAge = cookieOptions.maxAge / 1000; // Convert to seconds
				const halfLife = maxAge / 2;

				if (tokenAge > halfLife) {
					const newToken = jwt.sign({ userId: decoded.userId }, process.env.APP_SECRET);
					res.cookie(cookieName, newToken, cookieOptions);
				}
			}
		}
	}

	next();
};

export const attachUserToRequest = async (req: Request, _res: Response, next: Next) => {
	// don't attach user if not logged in
	if (!req.userId) return next();

	const user = await getUser(req.userId);
	if (user) req.user = user;

	next();
};

export const protectedRoute = async (req: Request, res: Response, next: Next) => {
	// attach userId for testing
	if (process.env.NODE_ENV === 'test') {
		req.userId = req.cookie;
		return next();
	}

	// Basic validation: cookie and userId must match
	if (!req.userId || !req.cookie || req.userId !== req.cookie) {
		return res.status(401).json({ error: 'Please log in to complete this request.' });
	}

	// Enhanced security: Validate Supabase token for protected routes
	const supabaseRefreshToken = req.signedCookies[supabaseCookieName];
	if (supabaseRefreshToken) {
		try {
			const { data, error } = await supabase.auth.refreshSession({
				refresh_token: supabaseRefreshToken,
			});

			// Verify Supabase user matches our cookie user
			if (error || !data.session || data.session.user?.id !== req.userId) {
				return res
					.status(401)
					.json({ error: 'Invalid authentication. Please log in again.' });
			}
		} catch (supabaseError) {
			return res
				.status(401)
				.json({ error: 'Authentication validation failed. Please log in again.' });
		}
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
