import { animate, stagger } from 'motion';
import { motionEase, stagger as staggerTokens } from '../tokens';
import { motionOk } from '../utils/reduced-motion.svelte';

export interface EventDetailTimelineElements {
	cover?: Element | null;
	title?: Element | null;
	infoItems?: Element[] | NodeList | null;
	description?: Element | null;
	guestCount?: Element | null;
	ctaButtons?: Element | null;
	secondary?: Element | null;
}

type SequenceSegment = [Element | Element[] | NodeList, Record<string, unknown>, Record<string, unknown>];

export function createEventDetailTimeline(elements: EventDetailTimelineElements) {
	if (!motionOk()) return null;

	const sequence: SequenceSegment[] = [];

	if (elements.cover) {
		sequence.push([elements.cover, { opacity: [0, 1] }, { duration: 0.6, at: 0 }]);
		sequence.push([elements.cover, { scale: [1.03, 1] }, { duration: 0.8, at: 0.1 }]);
	}
	if (elements.title) {
		sequence.push([elements.title, { y: [20, 0], opacity: [0, 1] }, { duration: 0.4, at: 0.2 }]);
	}
	if (elements.infoItems) {
		sequence.push([elements.infoItems as any, { y: [12, 0], opacity: [0, 1] }, {
			duration: 0.35, delay: stagger(staggerTokens.standard / 1000), at: 0.35
		}]);
	}
	if (elements.description) {
		sequence.push([elements.description, { opacity: [0, 1] }, { duration: 0.3, at: 0.5 }]);
	}
	if (elements.guestCount) {
		sequence.push([elements.guestCount, { x: [-20, 0], opacity: [0, 1] }, { duration: 0.3, at: 0.6 }]);
	}
	if (elements.ctaButtons) {
		sequence.push([elements.ctaButtons, { scale: [0.9, 1], opacity: [0, 1] }, {
			duration: 0.4, ease: motionEase.spring, at: 0.7
		}]);
	}
	if (elements.secondary) {
		sequence.push([elements.secondary, { opacity: [0, 1] }, { duration: 0.3, at: 0.9 }]);
	}

	if (sequence.length === 0) {
		// Return a minimal controls object for empty sequences
		return { stop: () => {}, finished: Promise.resolve() };
	}

	const controls = animate(sequence as any, {
		defaultTransition: { ease: motionEase.enter }
	});

	return controls;
}
