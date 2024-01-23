import { UserAttachedToRequest } from '../server/serverTypes.js';
// to make the file a module and avoid the TypeScript error
export {};

declare global {
	namespace Express {
		export interface Request extends UserAttachedToRequest {}
	}
}
