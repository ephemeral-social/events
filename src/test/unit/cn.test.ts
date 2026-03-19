import { describe, it, expect } from 'vitest';
import { cn } from '$lib/utils/cn';

describe('cn', () => {
	it('merges class strings', () => {
		expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
	});

	it('handles undefined, null, and false values', () => {
		expect(cn('text-red-500', undefined, null, false, 'bg-blue-500')).toBe(
			'text-red-500 bg-blue-500'
		);
	});

	it('resolves Tailwind conflicts with last-wins', () => {
		expect(cn('p-4', 'p-2')).toBe('p-2');
	});

	it('resolves conflicting text color variants', () => {
		// twMerge should keep the last text color and drop the first
		expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
	});

	it('preserves non-conflicting variant classes', () => {
		// hover:bg-red-500 and bg-blue-500 are different variants, both kept
		expect(cn('hover:bg-red-500', 'bg-blue-500')).toBe('hover:bg-red-500 bg-blue-500');
	});
});
