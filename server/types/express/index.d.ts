import { UserAttachedToRequest } from '../server/server-types.ts';
// to make the file a module and avoid the TypeScript error
export {};

declare global {
	namespace Express {
		export interface Request extends UserAttachedToRequest {}
	}
}
