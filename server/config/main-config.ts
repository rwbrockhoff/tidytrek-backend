import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { Express } from 'express';
import { acceptedOrigins, corsErrorMessage } from './config-vars.js';
import { validateEnvironment } from './environment.js';
import redisClient from './redis-config.js';
import {
	createApiRateLimit,
	createAuthRateLimit,
	createUploadRateLimit,
	createImportRateLimit,
	createAccountDeletionRateLimit,
} from './rate-limiting.js';

const env = validateEnvironment();

const mainConfig = async (app: Express) => {
	if (env.NODE_ENV !== 'test') {
		await redisClient.connect();

		const logFormat =
			env.NODE_ENV === 'production'
				? ':method :url :status :res[content-length] - :response-time ms'
				: 'dev';

		app.use(morgan(logFormat));
	}

	if (env.NODE_ENV === 'production') {
		app.set('trust proxy', 1);
	} else {
		app.set('trust proxy', false);
	}

	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					imgSrc: ["'self'", 'data:', 'https:'],
					connectSrc: ["'self'", 'https://api.sentry.io'],
					scriptSrc: ["'self'", 'https://accounts.google.com', 'https://apis.google.com'],
					frameSrc: ["'self'", 'https://accounts.google.com'],
				},
			},
		}),
	);

	app.use(compression());

	app.use(express.urlencoded({ extended: false, limit: '1mb' }));
	app.use(express.json({ limit: '1mb' }));

	const apiRateLimit = createApiRateLimit(redisClient);
	const authRateLimit = createAuthRateLimit(redisClient);
	const uploadRateLimit = createUploadRateLimit(redisClient);
	const importRateLimit = createImportRateLimit(redisClient);
	const accountDeletionRateLimit = createAccountDeletionRateLimit(redisClient);

	app.use(apiRateLimit);
	app.use(
		cors({
			credentials: true,
			origin: (origin, cb) => {
				//testing
				if (!origin) return cb(null, true);

				if (!acceptedOrigins.includes(origin)) {
					return cb(new Error(corsErrorMessage), true);
				}
				//return true if accepted origin
				return cb(null, true);
			},
		}),
	);
	app.use(cookieParser(env.COOKIE_SECRET));

	return {
		authRateLimit,
		uploadRateLimit,
		importRateLimit,
		accountDeletionRateLimit,
	};
};

export default mainConfig;
