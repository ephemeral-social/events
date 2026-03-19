import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		// .svelte.ts files use Svelte runes — parse with svelte parser
		files: ['**/*.svelte.ts'],
		languageOptions: {
			parser: svelte.parser,
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		// Project-wide rule tuning
		rules: {
			// Allow @html with DOMPurify-sanitized content
			'svelte/no-at-html-tags': 'warn',
			// SvelteKit href/goto patterns don't need resolve() for internal routes
			'svelte/no-navigation-without-resolve': 'off',
			// Allow _prefixed unused vars (intentional placeholders)
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	},
	{
		// Relax rules for test files (MUST come after project-wide rules to override)
		files: ['src/test/**/*.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/', 'node_modules/']
	}
);
