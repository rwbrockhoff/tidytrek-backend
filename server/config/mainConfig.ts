import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { Express } from 'express';
import { acceptedOrigins, corsErrorMessage } from './configurationVariables.js';
import { apiRateLimit } from './rateLimiting.js';

const mainConfig = (app: Express) => {
	// Security headers (minimal benefit for JSON API, but standard practice)
	app.use(helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				imgSrc: ["'self'", "data:", "https:"], // Allow S3 images and external images
				connectSrc: ["'self'", "https://api.sentry.io"], // Allow Sentry
			},
		},
	}));

	// HTTP request logging - skip during tests
	if (process.env.NODE_ENV !== 'test') {
		const logFormat =
			process.env.NODE_ENV === 'production'
				? ':method :url :status :res[content-length] - :response-time ms' // production
				: 'dev'; // dev (colored messages)

		app.use(morgan(logFormat));
	}

	app.use(express.urlencoded({ extended: false }));
	app.use(express.json());
	
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
	app.use(cookieParser(process.env.COOKIE_SECRET));
};

export default mainConfig;
