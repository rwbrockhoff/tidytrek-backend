import camelcaseKeys from 'camelcase-keys';
import { KnexResponse } from '../types/server/serverTypes.js';

export const knexCamelCaseResponse = (result: KnexResponse) => {
	if (result) {
		if (result?.rows) return camelcaseKeys(result.rows as Record<string, unknown>[], { deep: true });
		else {
			return camelcaseKeys(result);
		}
	}
	return result;
};

export const cookieName = 'tidytrek_token';
export const supabaseCookieName = 'supabase_refresh';

export const domainName =
	process.env.NODE_ENV === 'production' ? 'tidytrek.co' : undefined;

export const cookieOptions = {
	httpOnly: true,
	maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days with rolling expiration
	signed: true,
	domain: domainName,
};

export const supabaseCookieOptions = {
	httpOnly: true,
	maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days (shorter for security)
	signed: true,
	domain: domainName,
};

export const isError = (err: unknown): err is Error => err instanceof Error;
