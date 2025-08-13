import { z } from 'zod';
import { logError } from './logger.js';

// Validate ENV variables and exit process on error
// Catch env issues quickly

const BaseEnvironmentSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']),
	PORT: z.coerce.number().default(3000),
	APP_SECRET: z.string().min(1),
	COOKIE_SECRET: z.string().min(1),
	FRONTEND_URL: z.url(),
	LANDING_PAGE_URL: z.url(),
	PROFILE_PHOTO_S3_BUCKET: z.string().min(1),
	BANNER_PHOTO_S3_BUCKET: z.string().min(1),
	PACK_PHOTO_S3_BUCKET: z.string().min(1),
	AWS_REGION: z.string().min(1),
	PP_S3_ACCESS_KEY: z.string().min(1),
	PP_S3_SECRET_ACCESS_KEY: z.string().min(1),
	CLOUDFRONT_PHOTO_UPLOAD_URL: z.url(),
	SUPABASE_CLIENT: z.string().min(1),
	SUPABASE_KEY: z.string().min(1),
	SUPABASE_PRIVATE_KEY: z.string().min(1),
	SENTRY_DSN: z.string().optional(),
});

const DevelopmentSchema = BaseEnvironmentSchema.extend({
	DB_HOST: z.string().default('127.0.0.1'),
	DB_PASSWORD: z.string().default('postgres'),
	FRONTEND_TEST_URL: z.url(),
	REDIS_HOST: z.string().default('127.0.0.1'),
});

const ProductionSchema = BaseEnvironmentSchema.extend({
	PRODUCTION_DB_HOST: z.string().min(1),
	PRODUCTION_DB_USER: z.string().min(1),
	PRODUCTION_DB_PASSWORD: z.string().min(1),
	REDIS_HOST: z.string().min(1),
});

function getEnvironmentSchema() {
	const nodeEnv = process.env.NODE_ENV;
	if (nodeEnv === 'production') return ProductionSchema;
	return DevelopmentSchema; // Default for dev/test
}

export type Environment =
	| z.infer<typeof DevelopmentSchema>
	| z.infer<typeof ProductionSchema>;

export function validateEnvironment(): Environment {
	try {
		const schema = getEnvironmentSchema();
		return schema.parse(process.env);
	} catch (error) {
		console.error('ENV validation failed - server cannot start');

		logError('Environment validation failed', error, {
			nodeEnv: process.env.NODE_ENV,
		});

		// Shut down Node on ENV error
		process.exit(1);
	}
}
