import camelcaseKeys from 'camelcase-keys';
import { randomBytes } from 'node:crypto';
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

export const createRandomId = async (num: number): Promise<string> => {
	return await randomBytes(num).toString('hex');
};
