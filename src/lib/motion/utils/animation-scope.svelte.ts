/** Minimal interface matching motion's AnimationPlaybackControls */
interface Stoppable {
	stop: () => void;
}

/**
 * Create a scoped animation context with auto-cleanup.
 * The setup function receives an `add` callback to register animation controls
 * that will be stopped when cleanup runs.
 * Returns a cleanup function, or undefined if no container.
 */
export function createAnimationScope(
	container: HTMLElement | undefined,
	setup: (scope: { add: (controls: Stoppable) => void; container: HTMLElement }) => void
): (() => void) | undefined {
	if (!container) return undefined;

	const animations: Stoppable[] = [];

	setup({
		add: (controls: Stoppable) => animations.push(controls),
		container
	});

	return () => {
		for (const anim of animations) {
			anim.stop();
		}
		animations.length = 0;
	};
}
