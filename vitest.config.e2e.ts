import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			globals: true,
			environment: 'node',
			setupFiles: ['./src/test/e2e/setup.ts'],
			include: ['src/test/e2e/**/*.test.ts'],
			testTimeout: 30000,
			pool: 'forks',
			isolate: false
		}
	})
);
