import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('GET /og/[slug]', () => {
	let handler: typeof import('../../routes/og/[slug]/+server').GET;

	beforeEach(async () => {
		vi.resetModules();
		const mod = await import('../../routes/og/[slug]/+server');
		handler = mod.GET;
	});

	function createRequestEvent(slug: string) {
		return {
			params: { slug }
		} as any;
	}

	it('redirects to the standalone OG worker', async () => {
		try {
			await handler(createRequestEvent('summer-party'));
			expect.fail('Should have thrown a redirect');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe(
				'https://ephemeral-og.ephemeralsocial.workers.dev/summer-party'
			);
		}
	});

	it('encodes the slug in the redirect URL', async () => {
		try {
			await handler(createRequestEvent('my event with spaces'));
			expect.fail('Should have thrown a redirect');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe(
				'https://ephemeral-og.ephemeralsocial.workers.dev/my%20event%20with%20spaces'
			);
		}
	});
});
