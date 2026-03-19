import { duration as durationTokens, cssEase } from '../tokens';
import { motionOk } from '../utils/reduced-motion.svelte';

export interface PressFeedbackParams {
	scale?: number;
	duration?: number;
}

/**
 * Svelte action: adds press-down scale feedback via pure CSS transitions.
 * Pure CSS transitions.
 */
export function pressFeedback(
	node: HTMLElement,
	params?: PressFeedbackParams
): { destroy: () => void } {
	const scaleValue = params?.scale ?? 0.97;
	const dur = params?.duration ?? durationTokens.instant;

	node.style.transition = `transform ${dur}ms ${cssEase.standard}`;

	const onDown = () => {
		if (!motionOk()) return;
		node.style.transform = `scale(${scaleValue})`;
	};

	const onUp = () => {
		node.style.transform = '';
	};

	node.addEventListener('pointerdown', onDown);
	node.addEventListener('pointerup', onUp);
	node.addEventListener('pointerleave', onUp);

	return {
		destroy: () => {
			node.removeEventListener('pointerdown', onDown);
			node.removeEventListener('pointerup', onUp);
			node.removeEventListener('pointerleave', onUp);
		}
	};
}
