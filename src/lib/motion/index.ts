// Tokens
export { duration, cssEase, motionEase, stagger, lifecycle, cssVar } from './tokens';

// Utilities
export {
	prefersReducedMotion,
	motionOk,
	getMotionDuration,
	motionConfig
} from './utils/reduced-motion.svelte';
export { getDeviceTier, supportsAmbientEffects, type DeviceTier } from './utils/device-tier';
export { createAnimationScope } from './utils/animation-scope.svelte';

// Actions
export { animateIn, type AnimateInParams } from './actions/animate-in';
export { pressFeedback, type PressFeedbackParams } from './actions/press-feedback';
export { scrollReveal, type ScrollRevealParams } from './actions/scroll-reveal';
export { staggerChildren, type StaggerChildrenParams } from './actions/stagger-children';
export { focusLift, type FocusLiftParams } from './actions/focus-lift';
export { sharedElement, type SharedElementParams } from './actions/shared-element';
export { swipeDismiss, type SwipeDismissParams } from './actions/swipe-dismiss';

// Transitions
export { organicFade } from './transitions/organic-fade';

// Timelines
export {
	createEventDetailTimeline,
	type EventDetailTimelineElements
} from './timelines/event-detail';

// Ambient
export type { AmbientRenderer, ThemeColors, Particle } from './ambient/types';
export { getAmbientTheme, getThemeColors, lerpColor, lerpThemeColors } from './ambient/theme-bridge';
export { PerformanceMonitor } from './ambient/performance';

// Components re-exported for convenience (consumers can also import directly)
// Note: Svelte components import via '$lib/motion/components/AnimatedList.svelte' etc.
