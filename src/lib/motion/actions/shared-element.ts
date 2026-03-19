import { motionOk } from '../utils/reduced-motion.svelte';

export interface SharedElementParams {
	name: string;
}

export function sharedElement(
	node: HTMLElement,
	params: SharedElementParams
): { destroy: () => void } {
	if (!motionOk()) return { destroy: () => {} };

	node.style.viewTransitionName = params.name;

	return {
		destroy() {
			node.style.viewTransitionName = '';
		}
	};
}
