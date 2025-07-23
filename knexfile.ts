import dotenv from 'dotenv';
import fs from 'fs';
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
			// Local uses 127.0.0.1, Docker overrides DB_HOST to container name (e.g. 'postgres')
			host: process.env.DB_HOST || '127.0.0.1',
			port: 5432,
			database: dbName,
			user: 'postgres',
			password: process.env.DB_PASSWORD || 'postgres',
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
			// Use AWS RDS certificate for secure SSL connection
			ssl: {
				ca: fs.readFileSync('/opt/rds-certs/rds-ca-2019-root.pem'),
				rejectUnauthorized: true,
			},
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
			// Local uses 127.0.0.1, Docker overrides DB_HOST to container name (e.g. 'postgres-test')
			host: process.env.DB_HOST || '127.0.0.1',
			port: 5432,
			database: `${dbName}_test`,
			user: 'postgres',
			password: process.env.DB_PASSWORD || 'postgres',
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
