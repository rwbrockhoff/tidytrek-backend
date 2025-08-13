import { validateEnvironment } from './config/environment.js';

const env = validateEnvironment();

import initializeApp from './server.js';
import { Request, Response } from 'express';
import { successResponse } from './utils/error-response.js';

initializeApp.then((server) => {
	server.get('/', (_req: Request, res: Response) => {
		return successResponse(res, { status: 'healthy' }, 'Server is up and running.');
	});

	server.listen(env.PORT, () => console.log(`Listening on ${env.PORT}`));
}).catch((error) => {
	console.error('Failed to initialize server:', error);
	process.exit(1);
});
