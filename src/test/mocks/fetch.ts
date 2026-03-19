import { vi } from 'vitest';

/**
 * Create a mock Response with JSON body.
 */
export function mockFetchJsonResponse(
	status: number,
	data: unknown,
	headers?: Record<string, string>
): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers }
	});
}

/**
 * Create a mock Response with text body.
 */
export function mockFetchTextResponse(
	status: number,
	text: string,
	contentType = 'text/plain'
): Response {
	return new Response(text, {
		status,
		headers: { 'Content-Type': contentType }
	});
}

/**
 * Mock global fetch and return the spy for assertions.
 */
export function mockFetch(response: Response | (() => Response)): ReturnType<typeof vi.spyOn> {
	const spy = vi.spyOn(globalThis, 'fetch');
	if (typeof response === 'function') {
		spy.mockImplementation(async () => response());
	} else {
		spy.mockResolvedValue(response);
	}
	return spy;
}

/**
 * Mock global fetch with sequential responses.
 */
export function mockFetchSequence(responses: Response[]): ReturnType<typeof vi.spyOn> {
	const spy = vi.spyOn(globalThis, 'fetch');
	let callIndex = 0;
	spy.mockImplementation(async () => {
		const response = responses[callIndex] ?? responses[responses.length - 1];
		callIndex++;
		return response;
	});
	return spy;
}

/**
 * Assert that fetch was called with a specific URL pattern and options.
 * Optionally checks headers and body when provided.
 */
export function expectFetchCalledWith(
	spy: ReturnType<typeof vi.spyOn>,
	urlPattern: string | RegExp,
	opts?: Partial<RequestInit> & {
		expectHeaders?: Record<string, string>;
		expectBody?: Record<string, unknown>;
	}
): void {
	const calls = spy.mock.calls;
	const match = calls.find(([url]) => {
		const urlStr = typeof url === 'string' ? url : (url as Request).url;
		if (typeof urlPattern === 'string') return urlStr.includes(urlPattern);
		return urlPattern.test(urlStr);
	});

	if (!match) {
		throw new Error(
			`Expected fetch to be called with URL matching ${urlPattern}, but calls were: ${calls.map(([url]) => (typeof url === 'string' ? url : (url as Request).url)).join(', ')}`
		);
	}

	if (opts) {
		const callOpts = match[1] as RequestInit | undefined;
		if (opts.method && callOpts?.method !== opts.method) {
			throw new Error(`Expected method ${opts.method}, got ${callOpts?.method}`);
		}

		if (opts.expectHeaders) {
			const callHeaders = callOpts?.headers as Record<string, string> | undefined;
			for (const [key, value] of Object.entries(opts.expectHeaders)) {
				const actual = callHeaders?.[key];
				if (actual !== value) {
					throw new Error(`Expected header ${key}=${value}, got ${actual}`);
				}
			}
		}

		if (opts.expectBody) {
			const bodyStr = callOpts?.body as string | undefined;
			if (!bodyStr) {
				throw new Error('Expected a request body but none was sent');
			}
			const parsed = JSON.parse(bodyStr);
			for (const [key, value] of Object.entries(opts.expectBody)) {
				if (parsed[key] !== value) {
					throw new Error(
						`Expected body.${key}=${JSON.stringify(value)}, got ${JSON.stringify(parsed[key])}`
					);
				}
			}
		}
	}
}
