import { animate, stagger as motionStagger } from 'motion';
import { lifecycle, motionEase, stagger as staggerTokens } from '../tokens';
import { motionOk } from '../utils/reduced-motion.svelte';

export interface StaggerChildrenParams {
	selector?: string;
	stagger?: number;
	y?: number;
	from?: 'start' | 'center' | 'end';
}

/**
 * Svelte action: staggers the entrance animation of child elements.
 * Uses motion's stagger() helper for orchestrated list/group reveals.
 */
export function staggerChildren(
	node: HTMLElement,
	params?: StaggerChildrenParams
): { destroy: () => void } {
	const targets = params?.selector ? node.querySelectorAll(params.selector) : node.children;

	if (!motionOk()) {
		animate(targets as any, { opacity: [0, 1] }, { duration: 0.15 });
		return { destroy: () => {} };
	}

	const y = params?.y ?? 12;
	const staggerAmount = params?.stagger ?? staggerTokens.standard / 1000;
	const fromDirection = params?.from ?? 'start';

	// Motion's stagger() supports from option for direction.
	let delayValue: ReturnType<typeof motionStagger>;
	if (fromDirection === 'end') {
		delayValue = motionStagger(staggerAmount, { from: 'last' });
	} else if (fromDirection === 'center') {
		delayValue = motionStagger(staggerAmount, { from: 'center' });
	} else {
		// start, edges, random — default to first
		delayValue = motionStagger(staggerAmount);
	}

	const controls = animate(targets as any, {
		opacity: [lifecycle.birth.from.opacity, 1],
		y: [y, 0],
		scale: [lifecycle.birth.from.scale, 1]
	}, {
		duration: lifecycle.birth.duration / 1000,
		delay: delayValue,
		ease: motionEase.enter
	});

	controls.finished.then(() => {
		(Array.from(targets) as HTMLElement[]).forEach(el => el.removeAttribute('style'));
	}).catch(() => {});

	return {
		destroy: () => {
			controls.stop();
		}
	};
}
