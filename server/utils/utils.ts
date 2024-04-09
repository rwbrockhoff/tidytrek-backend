import camelcaseKeys from 'camelcase-keys';
import { KnexResponse } from '../types/server/serverTypes.js';

export const knexCamelCaseResponse = (result: KnexResponse) => {
	if (result) {
		if (result?.rows) return camelcaseKeys(result.rows, { deep: true });
		else {
			return camelcaseKeys(result);
		}
	}
	return result;
};

export const cookieName = 'tidytrek_token';

export const domainName =
	process.env.NODE_ENV === 'production' ? 'tidytrek.co' : undefined;
// todo: '__Host-tidyToken'

export const cookieOptions = {
	httpOnly: true,
	maxAge: 1000 * 60 * 60 * 24 * 180, // 180 days
	signed: true,
	domain: domainName,
};
