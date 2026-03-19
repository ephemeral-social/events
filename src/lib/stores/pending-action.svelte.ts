/**
 * Pending action store — preserves interrupted user intent across auth flow.
 * When a user tries to RSVP/buy ticket without being logged in, their intent
 * is stored here. After auth completes, the action resumes automatically.
 */

export interface PendingAction {
	type: 'rsvp' | 'ticket' | 'comment' | 'photo';
	eventId: string;
	data?: Record<string, unknown>;
}

let pendingAction = $state<PendingAction | null>(null);

export function setPendingAction(action: PendingAction) {
	pendingAction = action;
}

export function getPendingAction(): PendingAction | null {
	return pendingAction;
}

export function clearPendingAction(): PendingAction | null {
	const action = pendingAction;
	pendingAction = null;
	return action;
}
