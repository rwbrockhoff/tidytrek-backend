import { validateEnvironment } from './config/environment.js';

const env = validateEnvironment();

import server from './server.js';
import { Request, Response } from 'express';
import { successResponse } from './utils/error-response.js';

server.get('/', (_req: Request, res: Response) => {
	return successResponse(res, { status: 'healthy' }, 'Server is up and running.');
});

server.listen(env.PORT, () => console.log(`Listening on ${env.PORT}`));
