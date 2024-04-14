import server from './server.js';
import { Request, Response } from 'express';
import { getSecret } from './utils/getSecrets.js';

const PORT = getSecret('PORT');

server.get('/', (_req: Request, res: Response) => {
	res.status(200).send('Server is up and running.');
});

server.listen(PORT, () => console.log(`Listening on ${PORT}`));
