import './config/config.js'; //dotenv
import express from 'express';

import mainConfig from './config/main-config.js';
import routeConfig from './config/route-config.js';
import customConfig from './config/custom-config.js';

const app = express();

async function initializeApp() {
	const rateLimiters = await mainConfig(app);
	customConfig(app);
	routeConfig(app, rateLimiters);
	return app;
}

export default initializeApp();
