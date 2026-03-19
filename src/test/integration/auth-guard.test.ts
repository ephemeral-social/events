import { describe, it, expect } from 'vitest';
import { redirect, isRedirect } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth-guard';
import { createMockSession } from '../helpers';

describe('requireAuth', () => {
	it('does NOT throw for valid session', () => {
		const session = createMockSession();

		expect(() => requireAuth(session)).not.toThrow();
	});

	it('throws redirect (302) to /auth for null session', () => {
		try {
			requireAuth(null);
			expect.unreachable('Expected redirect to be thrown');
		} catch (e: unknown) {
			expect(isRedirect(e)).toBe(true);
			if (isRedirect(e)) {
				expect(e.status).toBe(302);
				expect(e.location).toBe('/auth');
			}
		}
	});

	it('includes ?redirect= param when redirectTo is provided', () => {
		try {
			requireAuth(null, '/e/my-event');
			expect.unreachable('Expected redirect to be thrown');
		} catch (e: unknown) {
			expect(isRedirect(e)).toBe(true);
			if (isRedirect(e)) {
				expect(e.status).toBe(302);
				expect(e.location).toBe('/auth?redirect=%2Fe%2Fmy-event');
			}
		}
	});

	it('correctly encodes redirectTo URL with special characters', () => {
		try {
			requireAuth(null, '/e/party time?tab=details&view=all');
			expect.unreachable('Expected redirect to be thrown');
		} catch (e: unknown) {
			expect(isRedirect(e)).toBe(true);
			if (isRedirect(e)) {
				expect(e.status).toBe(302);
				expect(e.location).toBe('/auth?redirect=%2Fe%2Fparty%20time%3Ftab%3Ddetails%26view%3Dall');
			}
		}
	});

	it('redirects to /auth with no redirectTo param by default', () => {
		try {
			requireAuth(null);
			expect.unreachable('Expected redirect to be thrown');
		} catch (e: unknown) {
			expect(isRedirect(e)).toBe(true);
			if (isRedirect(e)) {
				expect(e.location).toBe('/auth');
				// Verify there's no query string
				expect(e.location).not.toContain('?');
			}
		}
	});

	it('redirects to /auth when redirectTo is empty string', () => {
		try {
			requireAuth(null, '');
			expect.unreachable('Expected redirect to be thrown');
		} catch (e: unknown) {
			expect(isRedirect(e)).toBe(true);
			if (isRedirect(e)) {
				expect(e.status).toBe(302);
				// Empty string is falsy, so no ?redirect= param
				expect(e.location).toBe('/auth');
			}
		}
	});
});
