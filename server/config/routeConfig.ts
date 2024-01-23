import authenticationRoutes from '../routes/authentication/authenticationRoutes.js';
import packRoutes from '../routes/pack/packRoutes.js';
import { protectedRoute } from '../utils/customMiddleware.js';
import { Application } from 'express';

const routeConfig = (app: Application) => {
	app.use('/auth', authenticationRoutes);
	app.use('/packs', protectedRoute, packRoutes);
};

export default routeConfig;
