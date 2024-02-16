import jwt from 'jsonwebtoken';
import knex from '../db/connection.js';
import snakeCaseKeys from 'snakecase-keys';
import { Request, Response, NextFunction as Next } from 'express';

type JwtPayload = { userId: number };

export const getUserId = async (req: Request, _res: Response, next: Next) => {
	// get token from signedCookies and verify jwt
	const token = req.signedCookies?.token;
	if (token && process.env.APP_SECRET) {
		// const { userId } = await jwt.verify(token, process.env.APP_SECRET);
		const { userId } = (await jwt.verify(token, process.env.APP_SECRET)) as JwtPayload;
		req.userId = userId;
	}
	next();
};

export const attachUserToRequest = async (req: Request, _res: Response, next: Next) => {
	//don't attach user if not logged in
	if (!req.userId) return next();

	const user = await knex('users')
		.select('user_id', 'first_name', 'last_name', 'email', 'username')
		.where({ user_id: req.userId })
		.first();

	if (user) {
		//no pass is returned from query, just added layer of caution
		delete user.password;
		if (!user.password) req.user = user;
	}
	next();
};

export const protectedRoute = async (req: Request, res: Response, next: Next) => {
	//middleware used for routes only accessible to logged in users
	if (!req.userId) {
		return res.status(400).json({ error: 'Please log in to complete this request.' });
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
