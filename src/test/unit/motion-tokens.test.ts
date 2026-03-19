import { describe, it, expect } from 'vitest';
import {
	duration,
	cssEase,
	motionEase,
	stagger,
	lifecycle,
	cssVar
} from '$lib/motion/tokens';

describe('motion tokens', () => {
	describe('duration', () => {
		it('exports all duration values', () => {
			expect(duration.instant).toBe(100);
			expect(duration.fast).toBe(200);
			expect(duration.standard).toBe(300);
			expect(duration.emphasis).toBe(500);
			expect(duration.lifecycle).toBe(800);
			expect(duration.ambient).toBe(3000);
		});

		it('all durations are positive integers', () => {
			for (const [, value] of Object.entries(duration)) {
				expect(value).toBeGreaterThan(0);
				expect(Number.isInteger(value)).toBe(true);
			}
		});
	});

	describe('cssEase', () => {
		it('exports valid CSS ease strings', () => {
			for (const [, value] of Object.entries(cssEase)) {
				expect(value).toMatch(/^cubic-bezier\(.+\)$/);
			}
		});
	});

	describe('motionEase', () => {
		it('exports BezierDefinition tuples', () => {
			expect(motionEase.enter).toEqual([0, 0, 0.2, 1]);
			expect(motionEase.exit).toEqual([0.4, 0, 1, 1]);
			expect(motionEase.standard).toEqual([0.4, 0, 0.2, 1]);
			expect(motionEase.spring).toEqual([0.34, 1.56, 0.64, 1]);
		});

		it('all tuples have 4 numbers', () => {
			for (const [, value] of Object.entries(motionEase)) {
				expect(Array.isArray(value)).toBe(true);
				expect(value.length).toBe(4);
				value.forEach((n: number) => expect(typeof n).toBe('number'));
			}
		});
	});

	describe('stagger', () => {
		it('exports stagger values', () => {
			expect(stagger.fast).toBe(30);
			expect(stagger.standard).toBe(50);
			expect(stagger.slow).toBe(80);
		});
	});

	describe('lifecycle', () => {
		it('birth has correct shape', () => {
			expect(lifecycle.birth.from).toEqual({ opacity: 0, y: 12, scale: 0.96 });
			expect(lifecycle.birth.duration).toBe(800);
			expect(lifecycle.birth.ease).toEqual([0, 0, 0.2, 1]);
		});

		it('death has correct shape', () => {
			expect(lifecycle.death.to).toEqual({ opacity: 0, y: -8, scale: 0.97 });
			expect(lifecycle.death.duration).toBe(500);
			expect(lifecycle.death.ease).toEqual([0.4, 0, 1, 1]);
		});

		it('breathing has correct shape', () => {
			expect(lifecycle.breathing).toEqual({
				scale: 1.025,
				duration: 4000
			});
		});
	});

	describe('cssVar', () => {
		it('wraps name with --motion- prefix and var()', () => {
			expect(cssVar('duration-standard')).toBe('var(--motion-duration-standard)');
		});

		it('works with ease tokens', () => {
			expect(cssVar('ease-enter')).toBe('var(--motion-ease-enter)');
		});
	});
});
