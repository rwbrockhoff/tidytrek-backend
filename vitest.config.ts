import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		poolOptions: { threads: { singleThread: true } },
		setupFiles: './server/tests/setup.ts',
	},
	plugins: [], // only if you are using custom tsconfig paths
});
