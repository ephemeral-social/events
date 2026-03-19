import { animate } from 'motion';
import { lifecycle } from '../tokens';
import { motionOk } from '../utils/reduced-motion.svelte';

export interface AnimateInParams {
	duration?: number;
	delay?: number;
	ease?: [number, number, number, number];
	from?: Record<string, number>;
}

/**
 * Svelte action: animates an element in using lifecycle.birth defaults.
 * Durations and delays are in ms (converted to seconds for motion).
 */
export function animateIn(
	node: HTMLElement,
	params?: AnimateInParams
): { destroy: () => void } {
	if (!motionOk()) {
		node.removeAttribute('style');
		return { destroy: () => {} };
	}

	const dur = (params?.duration ?? lifecycle.birth.duration) / 1000;
	const del = (params?.delay ?? 0) / 1000;
	const ease: [number, number, number, number] = params?.ease ?? lifecycle.birth.ease;
	const from = { ...lifecycle.birth.from, ...params?.from };

	const controls = animate(node, {
		opacity: [from.opacity, 1],
		y: [from.y, 0],
		scale: [from.scale, 1]
	}, {
		duration: dur,
		delay: del,
		ease
	});

	controls.finished.then(() => {
		node.removeAttribute('style');
	}).catch(() => {});

	return {
		destroy: () => {
			controls.stop();
		}
	};
}
