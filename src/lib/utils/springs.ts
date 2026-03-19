import { Spring } from 'svelte/motion';

export const SPRING_PRESETS = {
	buttonPress: { stiffness: 0.35, damping: 0.65 },
	sheet: { stiffness: 0.3, damping: 0.7 },
	dismiss: { stiffness: 0.4, damping: 0.75 },
	toggle: { stiffness: 0.5, damping: 0.6 },
	bounce: { stiffness: 0.25, damping: 0.55 }
};

export function createSpring(initial: number, preset: keyof typeof SPRING_PRESETS = 'buttonPress') {
	return new Spring(initial, SPRING_PRESETS[preset]);
}
