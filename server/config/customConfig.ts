import {
	getUserId,
	attachCookie,
	attachUserToRequest,
	convertRequestToSnakeCase,
	convertResponseToCamelCase,
} from '@/utils/customMiddleware.js';
import { Express } from 'express';

function customConfig(app: Express) {
	app.use(getUserId);
	app.use(attachCookie);
	app.use(attachUserToRequest);
	app.use(convertRequestToSnakeCase); // Convert requests
	app.use(convertResponseToCamelCase); // Convert responses last
}

export default customConfig;
