import { getSecret } from '../utils/getSecrets.js';

export const acceptedOrigins: string[] = [
	getSecret('FRONTEND_URL'),
	getSecret('LANDING_PAGE_URL'),
];

export const corsErrorMessage: string =
	'The CORS policy of this website does not allow access from the given origin.';
