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
