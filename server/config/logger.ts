import winston from 'winston';
import * as Sentry from '@sentry/node';

// Build transports array conditionally
const transports: winston.transport[] = [
	// Always log to console
	new winston.transports.Console(),
];

// Add file logging in production
if (process.env.NODE_ENV === 'production') {
	transports.push(
		new winston.transports.File({
			filename: 'logs/error.log',
			level: 'error',
		}),
	);
}

// Create the logger instance
const logger = winston.createLogger({
	level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		process.env.NODE_ENV === 'production'
			? winston.format.json() // JSON format for production
			: winston.format.combine(
					winston.format.colorize(),
					winston.format.simple(), // More readable format for dev
			  ),
	),
	transports,
});

// Simple wrapper to also send errors to Sentry
export const logError = (
	message: string,
	error?: Error,
	context?: { userId?: string },
) => {
	// Keep using Winston like before
	logger.error(message, { error: error?.message, stack: error?.stack, ...context });

	// Also send to Sentry if it's configured
	if (process.env.SENTRY_DSN && error) {
		Sentry.withScope((scope) => {
			if (context?.userId) scope.setUser({ id: context.userId });

			Sentry.captureException(error);
		});
	}
};

export default logger;
