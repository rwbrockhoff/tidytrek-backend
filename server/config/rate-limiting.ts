import rateLimit from 'express-rate-limit';

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5,
	message: {
		error: 'Too many authentication attempts. Please try again in 15 minutes.',
	},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	skipSuccessfulRequests: true, // Don't count successful requests
});

// General API rate limiting
export const apiRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100,
	message: {
		error: 'Too many requests. Please try again in 15 minutes.',
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// File upload rate limiting (more restrictive)
export const uploadRateLimit = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 10,
	message: {
		error: 'Too many file uploads. Please try again in 1 hour.',
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// Import/scraping rate limiting
export const importRateLimit = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 5,
	message: {
		error: 'Too many import requests. Please try again in 1 hour.',
	},
	standardHeaders: true,
	legacyHeaders: false,
});
