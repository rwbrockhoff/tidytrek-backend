import { type Request, type Response } from 'express';

export const isError = (err: unknown): err is Error => err instanceof Error;

// check if validated request body is empty (no fields to update)
export function hasEmptyValidatedBody(req: Request): boolean {
	return !req.validatedBody || Object.keys(req.validatedBody).length === 0;
}

// Error message
export const NO_VALID_FIELDS_MESSAGE = 'No valid fields provided to update.';

// Ensures that the valdiatedBody we create in middleware is typed
// going into our controller function to avoid req.validatedBody! or req?.validatedBody
// on every route.
function hasValidatedBody<T>(req: Request): req is ValidatedRequest<T> {
	return req.validatedBody !== undefined;
}

// Type wrapper for controller fucntions - provides typed req.validatedBody
// Wraps the controller rather than trying to get in the way of how Express
// wants this to be typed for middleware
export function withTypes<T>(
	controller: (req: ValidatedRequest<T>, res: Response) => Promise<Response | void>,
) {
	return (req: Request, res: Response) => {
		if (hasValidatedBody<T>(req)) {
			// TS now knows req is ValidatedRequest<T>
			return controller(req, res);
		}
		// Fallback
		throw new Error('Missing validatedBody - validation middleware may not have run');
	};
}

// Type for requests with validated body
export type ValidatedRequest<T> = Request & {
	validatedBody: T; // Required: any ValidatedRequest without error should have this prop
};
