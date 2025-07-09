import authenticationRoutes from '../routes/authentication/authentication-routes.js';
import packRoutes from '../routes/pack/pack-routes.js';
import closetRoutes from '../routes/closet/closet-routes.js';
import guestsRoutes from '../routes/guests/guests-routes.js';
import profileSettingsRoutes from '../routes/profile-settings/profile-settings-routes.js';
import profileRoutes from '../routes/profile/profile-routes.js';
import userSettingsRoutes from '../routes/user-settings/user-settings-routes.js';
import testRoutes from '../routes/test/test-routes.js';
import sentryTestRoutes from '../routes/sentry/sentry-test.js';
import { protectedRoute } from '../utils/custom-middleware.js';
import { Application } from 'express';

const routeConfig = (app: Application) => {
	app.use('/auth', authenticationRoutes);
	app.use('/guests', guestsRoutes);
	app.use('/packs', protectedRoute, packRoutes);
	app.use('/closet', protectedRoute, closetRoutes);
	app.use('/profile', protectedRoute, profileRoutes);
	app.use('/profile-settings', protectedRoute, profileSettingsRoutes);
	app.use('/user-settings', protectedRoute, userSettingsRoutes);

	// Test routes - only available in test environment
	if (process.env.NODE_ENV === 'test') app.use('/test', testRoutes);

	// Sentry test routes - dev only
	if (process.env.NODE_ENV === 'development') app.use('/sentry', sentryTestRoutes);
};

export default routeConfig;
