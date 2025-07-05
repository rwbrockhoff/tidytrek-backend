import winston from 'winston';
import * as Sentry from '@sentry/node';

// Simple type guard for Error objects
const isError = (error: unknown): error is Error => {
	return error instanceof Error;
};

// Extract error details safely from unknown error
const extractErrorDetails = (error: unknown) => {
	if (isError(error)) {
		return {
			message: error.message,
			stack: error.stack,
			actualError: error
		};
	}
	
	// Handle undefined/null or convert other types to Error
	const errorMessage = error ? String(error) : 'Unknown error';
	const newError = new Error(errorMessage);
	return {
		message: errorMessage,
		stack: newError.stack,
		actualError: newError
	};
};

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
export const logger = winston.createLogger({
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
	error?: unknown,
	context?: Record<string, unknown> & { userId?: string },
) => {
	const { message: errorMessage, stack, actualError } = extractErrorDetails(error);
	
	// Keep using Winston like before
	logger.error(message, { 
		error: errorMessage, 
		stack, 
		...context 
	});

	// Also send to Sentry in production only
	if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
		Sentry.withScope((scope) => {
			if (context?.userId) scope.setUser({ id: context.userId });
			Sentry.captureException(actualError);
		});
	}
};
