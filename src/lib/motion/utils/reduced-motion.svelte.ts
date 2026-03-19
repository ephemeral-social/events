import { browser } from '$app/environment';

let reduced = $state(false);

if (browser) {
	const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
	reduced = mql.matches;
	mql.addEventListener('change', (e) => {
		reduced = e.matches;
	});
}

/** Whether the user prefers reduced motion */
export function prefersReducedMotion(): boolean {
	return reduced;
}

/** Whether animations should run (inverse of prefersReducedMotion) */
export function motionOk(): boolean {
	return !reduced;
}

/** Returns the duration in ms, or 0 if reduced motion is preferred */
export function getMotionDuration(ms: number): number {
	return reduced ? 0 : ms;
}

/** Returns full config when motion OK, or a reduced config (no spatial transforms) when reduced */
export function motionConfig<T extends Record<string, unknown>>(
	full: T,
	reducedOverrides?: Partial<T>
): T {
	if (!reduced) return full;
	return {
		...full,
		duration: 0.15,
		y: 0,
		x: 0,
		scale: 1,
		rotation: 0,
		...reducedOverrides
	} as T;
}
