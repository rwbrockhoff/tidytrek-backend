import {
	getUserId,
	attachCookie,
	attachUserToRequest,
	convertRequestToSnakeCase,
	convertResponseToCamelCase,
} from '../utils/customMiddleware.js';
import { Express } from 'express';
import * as Sentry from '@sentry/node';

function customConfig(app: Express) {
	app.use(getUserId);
	app.use(attachCookie);
	app.use(attachUserToRequest);
	app.use(convertRequestToSnakeCase); // Convert requests
	app.use(convertResponseToCamelCase); // Convert responses last
	
	// Sentry Express error handler must be after all routes but before other error middleware
	Sentry.setupExpressErrorHandler(app);
}

export default customConfig;
