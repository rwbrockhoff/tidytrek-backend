import {
	getUserId,
	attachCookie,
	attachUserToRequest,
	changeCase,
} from '../utils/customMiddleware.js';
import { Express } from 'express';

function customConfig(app: Express) {
	app.use(getUserId);
	app.use(attachCookie);
	app.use(attachUserToRequest);
	app.use(changeCase);
}

export default customConfig;
