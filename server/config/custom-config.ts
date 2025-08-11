import { attachUserToRequest } from '../middleware/auth-middleware.js';
import { convertRequestToSnakeCase, convertResponseToCamelCase } from '../middleware/format-middleware.js';
import { setTestUserId } from '../middleware/test-middleware.js';
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
