import { Request, Response, NextFunction as Next } from 'express';
import { supabaseCookieName } from '../utils/constants.js';
import { validateEnvironment } from '../config/environment.js';
import { mockUser, notSeededUser } from '../db/mock/mock-data.js';

const env = validateEnvironment();

export const setTestUserId = async (req: Request, _res: Response, next: Next) => {
	// Only run in test environment
	if (env.NODE_ENV !== 'test' || process.env.NODE_ENV === 'production') return next();

	// If userId is set
	if (req.userId) return next();

	// Check for the test login cookie
	const supabaseRefreshToken = req.signedCookies[supabaseCookieName];
	if (supabaseRefreshToken) {
		// mockUser
		if (supabaseRefreshToken === mockUser.supabaseRefreshToken) {
			req.userId = mockUser.userId;
			// notSeededUser
		} else if (supabaseRefreshToken === notSeededUser.supabaseRefreshToken) {
			req.userId = notSeededUser.userId;
		}
	}

	next();
};
