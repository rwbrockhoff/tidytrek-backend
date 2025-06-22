import {
	getUserId,
	attachCookie,
	attachUserToRequest,
	changeCase,
	convertResponseToCamelCase,
} from '../utils/customMiddleware.js';
import { Express } from 'express';

function customConfig(app: Express) {
	app.use(getUserId);
	app.use(attachCookie);
	app.use(attachUserToRequest);
	app.use(changeCase); // Convert requests 
	app.use(convertResponseToCamelCase); // Convert responses last
}

export default customConfig;
