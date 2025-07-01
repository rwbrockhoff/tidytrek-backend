import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	test: {
		globals: true,
		poolOptions: { threads: { singleThread: true } },
		setupFiles: './server/tests/setup.ts',
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './server'),
		},
	},
});
