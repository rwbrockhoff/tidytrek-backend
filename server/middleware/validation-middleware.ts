import { z } from 'zod';
import { type Request, type Response, type NextFunction } from 'express';
import { badRequest } from '../utils/error-response.js';

// Middleware to validate request body with Zod schema
export function validateRequestBody<T>(schema: z.ZodSchema<T>) {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			req.validatedBody = schema.parse(req.body);
			next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				return badRequest(res, 'Request validation failed', error.issues);
			}
			return badRequest(res, 'Request validation failed');
		}
	};
}