import { motionOk } from './reduced-motion.svelte';

export type DeviceTier = 'high' | 'medium' | 'low';

let cached: DeviceTier | null = null;

function detect(): DeviceTier {
	if (typeof navigator === 'undefined') return 'medium';

	const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
	if (conn?.saveData) return 'low';

	const cores = navigator.hardwareConcurrency ?? 4;
	if (cores <= 2) return 'low';
	if (cores >= 4) return 'high';
	return 'medium';
}

/** Get the device performance tier (cached after first call) */
export function getDeviceTier(): DeviceTier {
	if (cached === null) {
		cached = detect();
	}
	return cached;
}

/** Whether the device supports ambient animations (high tier + motion OK) */
export function supportsAmbientEffects(): boolean {
	return getDeviceTier() === 'high' && motionOk();
}
