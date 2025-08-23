import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { RedisClientType } from 'redis';
import { validateEnvironment } from './environment.js';

const env = validateEnvironment();

function createRedisStore(redisClient: RedisClientType) {
	if (env.NODE_ENV === 'test') return undefined;

	return new RedisStore({
		// rate limiter passes Redis commands (e.g. ['INCR', 'key'])
		sendCommand: (...args: string[]) => redisClient.sendCommand(args),
	});
}

export function createAuthRateLimit(redisClient: RedisClientType) {
	return rateLimit({
		windowMs: 15 * 60 * 1000, // 15 min
		max: 10,
		message: {
			error: 'Too many authentication attempts. Please try again in 15 minutes.',
		},
		standardHeaders: true,
		legacyHeaders: false,
		skipSuccessfulRequests: true,
		store: createRedisStore(redisClient),
	});
}

export function createApiRateLimit(redisClient: RedisClientType) {
	return rateLimit({
		windowMs: 15 * 60 * 1000, // 15 min
		max: 500,
		message: {
			error: 'Too many requests. Please try again in 15 minutes.',
		},
		standardHeaders: true,
		legacyHeaders: false,
		skipSuccessfulRequests: true,
		store: createRedisStore(redisClient),
	});
}

export function createUploadRateLimit(redisClient: RedisClientType) {
	return rateLimit({
		windowMs: 60 * 60 * 1000, // 1 hour
		max: 20,
		message: {
			error: 'Too many file uploads. Please try again in 1 hour.',
		},
		standardHeaders: true,
		legacyHeaders: false,
		store: createRedisStore(redisClient),
	});
}

export function createImportRateLimit(redisClient: RedisClientType) {
	return rateLimit({
		windowMs: 60 * 60 * 1000, // 1 hour
		max: 10,
		message: {
			error: 'Too many import requests. Please try again in 1 hour.',
		},
		standardHeaders: true,
		legacyHeaders: false,
		store: createRedisStore(redisClient),
	});
}

export function createAccountDeletionRateLimit(redisClient: RedisClientType) {
	return rateLimit({
		windowMs: 24 * 60 * 60 * 1000, // 24 hours
		max: 5,
		message: {
			error: 'Too many account deletion requests. Please try again tomorrow.',
		},
		standardHeaders: true,
		legacyHeaders: false,
		store: createRedisStore(redisClient),
	});
}
