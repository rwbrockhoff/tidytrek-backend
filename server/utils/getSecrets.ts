export const getSecret = (key: string) => {
	if (process.env.NODE_ENV === 'production') {
		const config = JSON.parse(process.env?.MY_SECRETS || '{}');
		return config[key];
	} else return process.env[key];
};
