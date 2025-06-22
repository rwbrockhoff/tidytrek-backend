import dotenv from 'dotenv';
dotenv.config({
	path: process.env.NODE_ENV === 'production' ? 'production.env' : 'dev.env',
});
const dbName = 'tidytrek_db';

export const tables = {
	user: 'user',
	pack: 'pack',
	packCategory: 'pack_category',
	packItem: 'pack_item',
	userSettings: 'user_settings',
	socialLink: 'social_link',
	userProfile: 'user_profile',
} as const;

export default {
	development: {
		client: 'pg',
		connection: {
			host: '127.0.0.1',
			port: 5432,
			database: dbName,
		},
		asyncStackTraces: true,
		migrations: {
			extension: 'ts',
			directory: `${process.cwd()}/server/db/migrations`,
		},
		seeds: {
			extension: 'ts',
			directory: `${process.cwd()}/server/db/seeds`,
		},
	},
	production: {
		client: 'pg',
		connection: {
			host: `${process.env.PRODUCTION_DB_HOST}`,
			database: dbName,
			port: 5432,
			user: `${process.env.PRODUCTION_DB_USER}`,
			password: `${process.env.PRODUCTION_DB_PASSWORD}`,
			ssl: true,
		},
		migrations: {
			directory: `${process.cwd()}/server/db/migrations`,
		},
		seeds: {
			extension: 'ts',
			directory: `${process.cwd()}/server/db/seeds`,
		},
	},
	test: {
		client: 'pg',
		connection: {
			host: '127.0.0.1',
			port: 5432,
			database: `${dbName}_test`,
		},
		asyncStackTraces: true,
		migrations: {
			extension: 'js',
			directory: `${process.cwd()}/dist/server/db/migrations`,
		},
		seeds: {
			extension: 'js',
			directory: `${process.cwd()}/dist/server/db/seeds`,
		},
	},
};
