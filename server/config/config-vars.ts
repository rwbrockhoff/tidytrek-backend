import { validateEnvironment } from './environment.js';

const env = validateEnvironment();

export const acceptedOrigins: string[] = [
	env.FRONTEND_URL,
	env.LANDING_PAGE_URL,
	// include test url in dev/test env
	...(env.NODE_ENV !== 'production' && 'FRONTEND_TEST_URL' in env
		? [env.FRONTEND_TEST_URL]
		: []),
];

export const corsErrorMessage: string =
	'The CORS policy of this website does not allow access from the given origin.';
