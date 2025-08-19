import { Response } from 'express';
import { supabaseCookieName, domainName } from './constants.js';

export function clearAuthCookie(res: Response): void {
	const clearOptions = { ...(domainName && { domain: domainName }) };
	res.clearCookie(supabaseCookieName, clearOptions);
}