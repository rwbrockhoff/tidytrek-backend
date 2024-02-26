import authenticationRoutes from '../routes/authentication/authenticationRoutes.js';
import packRoutes from '../routes/pack/packRoutes.js';
import closetRoutes from '../routes/closet/closetRoutes.js';
import guestsRoutes from '../routes/guests/guestsRoutes.js';
import profileSettingsRoutes from '../routes/profileSettings/profleSettingsRoutes.js';
import profileRoutes from '../routes/profile/profileRoutes.js';
import { protectedRoute } from '../utils/customMiddleware.js';
import { Application } from 'express';

const routeConfig = (app: Application) => {
	app.use('/auth', authenticationRoutes);
	app.use('/guests', guestsRoutes);
	app.use('/packs', protectedRoute, packRoutes);
	app.use('/closet', protectedRoute, closetRoutes);
	app.use('/profile', protectedRoute, profileRoutes);
	app.use('/profile-settings', protectedRoute, profileSettingsRoutes);
};

export default routeConfig;
