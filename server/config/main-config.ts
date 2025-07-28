import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { Express } from 'express';
import { acceptedOrigins, corsErrorMessage } from './config-vars.js';
import { apiRateLimit } from './rate-limiting.js';
import { validateEnvironment } from './environment.js';

const env = validateEnvironment();

const mainConfig = (app: Express) => {
	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					imgSrc: ["'self'", 'data:', 'https:'], // Allow S3 images and external images
					connectSrc: ["'self'", 'https://api.sentry.io'], // Allow Sentry
				},
			},
		}),
	);

	// Request logging - skip during tests
	if (env.NODE_ENV !== 'test') {
		const logFormat =
			env.NODE_ENV === 'production'
				? ':method :url :status :res[content-length] - :response-time ms' // production
				: 'dev'; // dev (colored messages)

		app.use(morgan(logFormat));
	}

	app.use(express.urlencoded({ extended: false, limit: '1mb' }));
	app.use(express.json({ limit: '1mb' }));

	// General API rate limiting
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
};

export default mainConfig;
