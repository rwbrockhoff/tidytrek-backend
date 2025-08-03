import { UserAttachedToRequest } from '../server/server-types.ts';
// to make the file a module and avoid the TypeScript error
export {};

declare module 'express-serve-static-core' {
	interface Request extends UserAttachedToRequest {
		validatedBody?: unknown;
	}
}
