import { motionOk } from '../utils/reduced-motion.svelte';

export interface FocusLiftParams {
	lift?: number;
}

export function focusLift(node: HTMLElement, params?: FocusLiftParams): { destroy: () => void } {
	const lift = params?.lift ?? 1;

	if (!motionOk()) return { destroy: () => {} };

	const originalTransition = node.style.transition;
	const newTransition = ['transform 150ms cubic-bezier(0.4, 0, 0.2, 1)', originalTransition]
		.filter(Boolean)
		.join(', ');
	node.style.transition = newTransition;

	function onFocus() {
		node.style.transform = `translateY(-${lift}px)`;
	}
	function onBlur() {
		node.style.transform = '';
	}

	node.addEventListener('focus', onFocus);
	node.addEventListener('blur', onBlur);

	return {
		destroy() {
			node.removeEventListener('focus', onFocus);
			node.removeEventListener('blur', onBlur);
			node.style.transition = originalTransition;
		}
	};
}
