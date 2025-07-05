// Load environment variables first
import dotenv from 'dotenv';
dotenv.config({
	path: process.env.NODE_ENV === 'production' ? 'production.env' : 'dev.env',
});

import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;
const environment = process.env.NODE_ENV || 'development';

if (dsn) {
	Sentry.init({
		dsn,
		environment,
		// Performance monitoring: track 100% in dev, 10% in prod
		tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
		// PII handling: currently only send user IDs (not emails, names, etc.)
	});
	console.log(`Sentry initialized for environment: ${environment}`);
} else {
	console.warn('Sentry DSN not configured. Skipping Sentry initialization.');
}
