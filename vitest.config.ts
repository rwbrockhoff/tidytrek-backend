import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		poolOptions: { threads: { singleThread: true } },
		setupFiles: './dist/server/tests/setup.js',
	},
});
