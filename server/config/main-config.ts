import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { Express } from 'express';
import { acceptedOrigins, corsErrorMessage } from './config-vars.js';
import { apiRateLimit } from './rate-limiting.js';
import { validateEnvironment } from './environment.js';

const env = validateEnvironment();

const mainConfig = (app: Express) => {
	if (env.NODE_ENV === 'production') {
		// 1: trust only first - load balancer
		app.set('trust proxy', 1);
	} else {
		app.set('trust proxy', false);
	}

	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					imgSrc: ["'self'", 'data:', 'https:'], // Allow S3 images and external images
					connectSrc: ["'self'", 'https://api.sentry.io'], // Allow Sentry
					scriptSrc: ["'self'", 'https://accounts.google.com', 'https://apis.google.com'], // Allow Google OAuth scripts
					frameSrc: ["'self'", 'https://accounts.google.com'], // Allow Google OAuth frames
				},
			},
		}),
	);

	app.use(compression());

	// Skip logging during tests
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
