import { motionOk } from '../utils/reduced-motion.svelte';

export interface SwipeDismissParams {
	threshold?: number;
	onDismiss: () => void;
	direction?: 'horizontal' | 'vertical';
	activationDelay?: number;
}

export function swipeDismiss(
	node: HTMLElement,
	params: SwipeDismissParams
): { destroy: () => void } {
	if (!motionOk()) return { destroy: () => {} };

	const threshold = params.threshold ?? 80;
	const isHorizontal = params.direction !== 'vertical';
	const activationDelay = params.activationDelay ?? 300;
	let startPos = 0;
	let currentDelta = 0;
	let isDragging = false;
	let isActive = false;
	let activationTimer: ReturnType<typeof setTimeout>;

	activationTimer = setTimeout(() => {
		isActive = true;
	}, activationDelay);

	function onPointerDown(e: PointerEvent) {
		if (!isActive) return;
		startPos = isHorizontal ? e.clientX : e.clientY;
		isDragging = true;
		node.setPointerCapture(e.pointerId);
		node.style.transition = 'none';
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging) return;
		currentDelta = (isHorizontal ? e.clientX : e.clientY) - startPos;
		node.style.transform = isHorizontal
			? `translateX(${currentDelta}px)`
			: `translateY(${currentDelta}px)`;
		node.style.opacity = `${Math.max(0, 1 - Math.abs(currentDelta) / (threshold * 2))}`;
	}

	function onPointerUp() {
		isDragging = false;
		if (Math.abs(currentDelta) > threshold) {
			node.style.transition = 'transform 200ms ease-out, opacity 200ms ease-out';
			const exitDelta = currentDelta > 0 ? 300 : -300;
			node.style.transform = isHorizontal
				? `translateX(${exitDelta}px)`
				: `translateY(${exitDelta}px)`;
			node.style.opacity = '0';
			setTimeout(() => params.onDismiss(), 200);
		} else {
			node.style.transition =
				'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease';
			node.style.transform = '';
			node.style.opacity = '1';
		}
		currentDelta = 0;
	}

	node.addEventListener('pointerdown', onPointerDown);
	node.addEventListener('pointermove', onPointerMove);
	node.addEventListener('pointerup', onPointerUp);
	node.addEventListener('pointercancel', onPointerUp);

	return {
		destroy() {
			clearTimeout(activationTimer);
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerup', onPointerUp);
			node.removeEventListener('pointercancel', onPointerUp);
			node.style.transition = '';
			node.style.transform = '';
			node.style.opacity = '';
		}
	};
}
