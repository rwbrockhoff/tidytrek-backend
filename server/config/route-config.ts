import { createAuthRoutes } from '../routes/authentication/authentication-routes.js';
import { createPackRoutes } from '../routes/pack/pack-routes.js';
import closetRoutes from '../routes/closet/closet-routes.js';
import guestsRoutes from '../routes/guests/guests-routes.js';
import { createProfileSettingsRoutes } from '../routes/profile-settings/profile-settings-routes.js';
import profileRoutes from '../routes/profile/profile-routes.js';
import userSettingsRoutes from '../routes/user-settings/user-settings-routes.js';
import redirectRoutes from '../routes/redirect/redirect-routes.js';
import testRoutes from '../routes/test/test-routes.js';
import { protectedRoute } from '../middleware/auth-middleware.js';
import { Application, RequestHandler } from 'express';
import { validateEnvironment } from './environment.js';

const env = validateEnvironment();

interface RateLimiters {
	authRateLimit: RequestHandler;
	uploadRateLimit: RequestHandler;
	importRateLimit: RequestHandler;
}

const routeConfig = (app: Application, rateLimiters: RateLimiters) => {
	const authRoutes = createAuthRoutes(rateLimiters.authRateLimit);
	const packRoutes = createPackRoutes(rateLimiters.uploadRateLimit, rateLimiters.importRateLimit);
	const profileSettingsRoutes = createProfileSettingsRoutes(rateLimiters.uploadRateLimit);

	app.use('/auth', authRoutes);
	app.use('/guests', guestsRoutes);
	app.use('/redirect', redirectRoutes);
	app.use('/packs', protectedRoute, packRoutes);
	app.use('/closet', protectedRoute, closetRoutes);
	app.use('/profile', protectedRoute, profileRoutes);
	app.use('/profile-settings', protectedRoute, profileSettingsRoutes);
	app.use('/user-settings', protectedRoute, userSettingsRoutes);

	if (env.NODE_ENV === 'test') app.use('/test', testRoutes);
};

export default routeConfig;
