import { cubicOut } from 'svelte/easing';
import { prefersReducedMotion } from '../utils/reduced-motion.svelte';

interface OrganicFadeParams {
	duration?: number;
	delay?: number;
}

/**
 * Svelte-native transition: organic fade with scale and vertical shift.
 * Returns { delay, duration, css } for use with `transition:`, `in:`, `out:` directives.
 * Pure CSS via Svelte's transition contract.
 */
export function organicFade(node: HTMLElement, params: OrganicFadeParams = {}) {
	const isReduced = prefersReducedMotion();
	const d = isReduced ? 150 : (params.duration ?? 500);

	return {
		delay: params.delay ?? 0,
		duration: d,
		css: (t: number) => {
			const eased = cubicOut(t);
			if (isReduced) {
				return `opacity: ${eased}`;
			}
			return `
				opacity: ${eased};
				transform: scale(${0.96 + 0.04 * eased}) translateY(${12 * (1 - eased)}px);
			`;
		}
	};
}
