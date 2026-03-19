/** Motion duration tokens (milliseconds) */
export const duration = {
	instant: 100,
	fast: 200,
	standard: 300,
	emphasis: 500,
	lifecycle: 800,
	ambient: 3000
} as const;

/** CSS cubic-bezier easing curves (for CSS transitions) */
export const cssEase = {
	enter: 'cubic-bezier(0, 0, 0.2, 1)',
	exit: 'cubic-bezier(0.4, 0, 1, 1)',
	standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
	spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
} as const;

/** Motion-compatible easing values (BezierDefinition tuples for animate()) */
export const motionEase = {
	enter: [0, 0, 0.2, 1] as [number, number, number, number],
	exit: [0.4, 0, 1, 1] as [number, number, number, number],
	standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
	spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number]
};

/** Stagger delay tokens (milliseconds per item) */
export const stagger = {
	fast: 30,
	standard: 50,
	slow: 80
} as const;

/** Lifecycle animation presets */
export const lifecycle = {
	birth: {
		from: { opacity: 0, y: 12, scale: 0.96 },
		duration: 800,
		ease: [0, 0, 0.2, 1] as [number, number, number, number]
	},
	death: {
		to: { opacity: 0, y: -8, scale: 0.97 },
		duration: 500,
		ease: [0.4, 0, 1, 1] as [number, number, number, number]
	},
	breathing: {
		scale: 1.025,
		duration: 4000
	}
};

/** Generate a CSS var() reference with --motion- prefix */
export function cssVar(name: string): string {
	return `var(--motion-${name})`;
}
