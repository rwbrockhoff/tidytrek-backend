// Load environment variables first
import dotenv from 'dotenv';
dotenv.config({
	path: process.env.NODE_ENV === 'production' ? 'production.env' : 'dev.env',
});

import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;
const environment = process.env.NODE_ENV || 'development';

if (dsn && environment === 'production') {
	Sentry.init({
		dsn,
		environment,
		tracesSampleRate: 0.1,
		// PII handling: currently only send user IDs (not emails, names, etc.)
	});
	console.log(`Sentry initialized for environment: ${environment}`);
} else {
	console.log('Sentry disabled for development environment');
}
