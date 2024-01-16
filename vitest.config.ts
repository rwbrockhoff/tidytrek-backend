import tsconfigPaths from "vite-tsconfig-paths"; // only if you are using custom tsconfig paths
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    poolOptions: { threads: { singleThread: true } },
    // setupFiles: "./src/tests/setup.ts",
  },
  plugins: [], // only if you are using custom tsconfig paths
});

// tsconfigPaths()
