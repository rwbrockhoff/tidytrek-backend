import server from './server.js';
const port = process.env.PORT;
import { Request, Response } from 'express';

server.get('/', (_req: Request, res: Response) => {
	res.status(200).send('Server is up and running.');
});

server.listen(port, () => console.log(`Listening on ${port}`));
