export const acceptedOrigins: string[] = [
	// @ts-expect-error ENV variable
	process.env.FRONTEND_URL,
	// @ts-expect-error ENV variable
	process.env.LANDING_PAGE_URL,
	// @ts-expect-error ENV variable
	process.env.FRONTEND_TEST_URL,
];

export const corsErrorMessage: string =
	'The CORS policy of this website does not allow access from the given origin.';
