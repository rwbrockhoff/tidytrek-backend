import jwt from 'jsonwebtoken';
import snakeCaseKeys from 'snakecase-keys';
import { Request, Response, NextFunction as Next } from 'express';
import { getUser } from '../routes/authentication/authenticationController.js';
import { cookieName } from './utils.js';

type JwtPayload = { userId: string };

export const getUserId = async (req: Request, _res: Response, next: Next) => {
	//--supabase
	const authHeader = req.headers['authorization'];
	if (authHeader) {
		// Split the authorization header value by whitespace
		const parts = authHeader.split(' ');
		// Check if the authorization header has the correct format
		if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
			// Extract the token from the authorization header
			const token = parts[1];
			// Attach user from verified JWT to request
			if (token && process.env.SUPABASE_KEY) {
				const { sub: userId } = jwt.verify(token, process.env.SUPABASE_KEY);
				if (typeof userId === 'string') req.userId = userId;
			}
		}
	}
	//--supabase

	next();
};

export const attachCookie = (req: Request, _res: Response, next: Next) => {
	// get token from signedCookies and verify jwt
	const token = req.signedCookies[cookieName] || null;

	if (token && process.env.APP_SECRET) {
		const { userId } = jwt.verify(token, process.env.APP_SECRET) as JwtPayload;
		req.cookie = userId;
	}

	next();
};

export const attachUserToRequest = async (req: Request, _res: Response, next: Next) => {
	//don't attach user if not logged in
	if (!req.userId) return next();

	const user = await getUser(req.userId);
	if (user) req.user = user;

	next();
};

export const protectedRoute = async (req: Request, res: Response, next: Next) => {
	// attach userId for testing
	if (process.env.NODE_ENV === 'test') req.userId = req.cookie;
	else {
		//middleware used for routes only accessible to logged in users
		if (!req.userId || !req.cookie || req.userId !== req.cookie) {
			return res.status(400).json({ error: 'Please log in to complete this request.' });
		}
	}
	next();
};

export const changeCase = (req: Request, _res: Response, next: Next) => {
	if (req.body) {
		const snakeCaseBody = snakeCaseKeys(req.body);
		req.body = snakeCaseBody;
	}
	next();
};
