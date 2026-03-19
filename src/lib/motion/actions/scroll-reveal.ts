import { animate } from 'motion';
import { lifecycle, motionEase } from '../tokens';
import { motionOk } from '../utils/reduced-motion.svelte';

export interface ScrollRevealParams {
	y?: number;
	delay?: number;
	once?: boolean;
}

/**
 * Svelte action: reveals an element when it scrolls into view.
 * Uses IntersectionObserver (not ScrollTrigger) for lightweight scroll detection.
 */
export function scrollReveal(
	node: HTMLElement,
	params?: ScrollRevealParams
): { destroy: () => void } {
	if (!motionOk()) {
		return { destroy: () => {} };
	}

	const y = params?.y ?? 20;
	const delay = (params?.delay ?? 0) / 1000;
	const once = params?.once !== false;

	// Set initial hidden state
	animate(node, { opacity: 0, y }, { duration: 0 });

	let controls: ReturnType<typeof animate> | undefined;

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					controls = animate(node, { opacity: 1, y: 0 }, {
						duration: lifecycle.birth.duration / 1000,
						delay,
						ease: motionEase.enter
					});
					controls.finished.then(() => {
						node.removeAttribute('style');
					}).catch(() => {});
					if (once) {
						observer.disconnect();
					}
				}
			}
		},
		{ threshold: 0.15, rootMargin: '0px 0px -120px 0px' }
	);

	observer.observe(node);

	return {
		destroy: () => {
			observer.disconnect();
			controls?.stop();
		}
	};
}
