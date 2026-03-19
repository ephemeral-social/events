import type { SessionData } from '$lib/server/session';
import type {
	PublicEvent,
	PublicEventData,
	TombstoneData,
	EventHost,
	RsvpCounts,
	PrivacyStats
} from '$lib/utils/event-helpers';
import { createMockKV, MockKV } from './mocks/kv.js';
import { MockCookies } from './mocks/cookies.js';

// Re-export createMockPlatform from its canonical location
export { createMockPlatform } from './mocks/request-event.js';

/**
 * Seed a KV session + cookie pair for testing authenticated routes.
 * Extracted from per-file duplicates across all api test files.
 */
export async function seedSession(
	kv: MockKV,
	cookies: MockCookies,
	sessionOverrides?: Partial<SessionData>
): Promise<void> {
	const session = createMockSession(sessionOverrides);
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

export function createMockSession(overrides?: Partial<SessionData>): SessionData {
	return {
		userId: 'user-001',
		accessToken: 'test-access-token',
		refreshToken: 'test-refresh-token',
		displayName: 'Test User',
		expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
		...overrides
	};
}

export function createMockEvent(overrides?: Partial<PublicEvent>): PublicEvent {
	return {
		event_id: 'evt-001',
		title: 'Test Event',
		description: 'A test event description',
		start_time: '2025-03-15T19:00:00Z',
		end_time: '2025-03-15T22:00:00Z',
		timezone: 'America/New_York',
		visibility: 'public',
		created_at: '2025-03-01T12:00:00Z',
		slug: 'test-event-0315',
		...overrides
	};
}

export function createMockEventData(overrides?: {
	event?: Partial<PublicEvent>;
	host?: Partial<EventHost> | null;
	rsvp_counts?: Partial<RsvpCounts>;
	privacy_stats?: Partial<PrivacyStats>;
}): PublicEventData {
	return {
		event: createMockEvent(overrides?.event),
		host:
			overrides?.host === null
				? null
				: {
						user_id: 'host-001',
						display_name: 'Test Host',
						...overrides?.host
					},
		rsvp_counts: {
			going: 10,
			maybe: 3,
			...overrides?.rsvp_counts
		},
		privacy_stats: {
			photo_count: 0,
			metadata_stripped: true,
			data_sharing: 'none',
			...overrides?.privacy_stats
		}
	};
}

export function createMockTombstone(overrides?: Partial<TombstoneData>): TombstoneData {
	return {
		deleted: true,
		title: 'Deleted Event',
		deleted_at: '2025-04-01T00:00:00Z',
		...overrides
	};
}

export function createMockRsvp(overrides?: Record<string, unknown>) {
	return {
		status: 'going',
		plus_ones: 0,
		display_name: 'Test Guest',
		responded_at: '2025-03-10T12:00:00Z',
		...overrides
	};
}
