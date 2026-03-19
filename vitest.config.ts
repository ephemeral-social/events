import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			globals: true,
			environment: 'node',
			setupFiles: ['./src/test/setup.ts'],
			include: ['src/**/*.test.ts'],
			exclude: ['src/test/e2e/**', '**/node_modules/**']
		},
		resolve: {
			conditions: ['browser']
		}
	})
);
