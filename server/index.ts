import server from './server.js';
const port = process.env.PORT;
import { Request, Response } from 'express';
import { successResponse } from './utils/error-response.js';

server.get('/', (_req: Request, res: Response) => {
	return successResponse(res, { status: 'healthy' }, 'Server is up and running.');
});

server.listen(port, () => console.log(`Listening on ${port}`));
