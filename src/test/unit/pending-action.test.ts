import { describe, it, expect, beforeEach } from 'vitest';
import {
	setPendingAction,
	getPendingAction,
	clearPendingAction,
	type PendingAction
} from '$lib/stores/pending-action.svelte';

describe('pending-action store', () => {
	beforeEach(() => {
		// Clear any residual state between tests
		clearPendingAction();
	});

	it('starts as null', () => {
		expect(getPendingAction()).toBeNull();
	});

	it('setPendingAction stores and getPendingAction retrieves', () => {
		const action: PendingAction = { type: 'rsvp', eventId: 'evt-001' };
		setPendingAction(action);
		expect(getPendingAction()).toEqual(action);
	});

	it('clearPendingAction returns stored action and resets to null', () => {
		const action: PendingAction = { type: 'ticket', eventId: 'evt-002', data: { qty: 2 } };
		setPendingAction(action);
		const cleared = clearPendingAction();
		expect(cleared).toEqual(action);
		expect(getPendingAction()).toBeNull();
	});

	it('multiple setPendingAction calls overwrite previous', () => {
		setPendingAction({ type: 'rsvp', eventId: 'evt-001' });
		setPendingAction({ type: 'comment', eventId: 'evt-003' });
		expect(getPendingAction()).toEqual({ type: 'comment', eventId: 'evt-003' });
	});

	it('supports all action types', () => {
		const types: PendingAction['type'][] = ['rsvp', 'ticket', 'comment', 'photo'];
		for (const type of types) {
			const action: PendingAction = { type, eventId: `evt-${type}` };
			setPendingAction(action);
			expect(getPendingAction()?.type).toBe(type);
		}
	});
});
