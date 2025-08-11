import {
	attachUserToRequest,
	convertRequestToSnakeCase,
	convertResponseToCamelCase,
} from '../utils/custom-middleware.js';
import { setTestUserId } from '../utils/test-middleware.js';
import { Express } from 'express';
import * as Sentry from '@sentry/node';

function customConfig(app: Express) {
	app.use(setTestUserId);
	app.use(attachUserToRequest);
	app.use(convertRequestToSnakeCase);
	app.use(convertResponseToCamelCase);

	// must be after all routes but before other error middleware
	Sentry.setupExpressErrorHandler(app);
}

export default customConfig;
