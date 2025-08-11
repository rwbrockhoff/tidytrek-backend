import snakeCaseKeys from 'snakecase-keys';
import camelCaseKeys from 'camelcase-keys';
import { Request, Response, NextFunction as Next } from 'express';

export const convertRequestToSnakeCase = (req: Request, _res: Response, next: Next) => {
	if (req.body) {
		const snakeCaseBody = snakeCaseKeys(req.body);
		req.body = snakeCaseBody;
	}
	next();
};

export const convertResponseToCamelCase = (_req: Request, res: Response, next: Next) => {
	const originalJson = res.json;

	res.json = function (body) {
		if (body && typeof body === 'object') {
			const camelCaseBody = camelCaseKeys(body, { deep: true });
			return originalJson.call(this, camelCaseBody);
		}
		return originalJson.call(this, body);
	};

	next();
};