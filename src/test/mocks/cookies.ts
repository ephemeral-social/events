/**
 * Mock SvelteKit Cookies for testing.
 * Intentionally does not `implements Cookies` to avoid strict type
 * incompatibilities with CookieSerializeOptions. Works at runtime
 * because SvelteKit only calls get/set/delete/getAll.
 */
export class MockCookies {
	private store = new Map<string, string>();
	private setOpts = new Map<string, Record<string, unknown>>();
	private deleteOpts = new Map<string, Record<string, unknown>>();

	get(name: string): string | undefined {
		return this.store.get(name);
	}

	getAll(): { name: string; value: string }[] {
		return Array.from(this.store.entries()).map(([name, value]) => ({ name, value }));
	}

	set(name: string, value: string, opts?: Record<string, unknown>): void {
		this.store.set(name, value);
		if (opts) {
			this.setOpts.set(name, opts);
		}
	}

	delete(name: string, opts?: Record<string, unknown>): void {
		this.store.delete(name);
		this.setOpts.delete(name);
		if (opts) {
			this.deleteOpts.set(name, opts);
		}
	}

	serialize(): string {
		return '';
	}

	// Test helpers
	getSetOptions(name: string): Record<string, unknown> | undefined {
		return this.setOpts.get(name);
	}

	getDeleteOptions(name: string): Record<string, unknown> | undefined {
		return this.deleteOpts.get(name);
	}

	has(name: string): boolean {
		return this.store.has(name);
	}

	clear(): void {
		this.store.clear();
		this.setOpts.clear();
		this.deleteOpts.clear();
	}
}

export function createMockCookies(initial?: Record<string, string>): MockCookies {
	const cookies = new MockCookies();
	if (initial) {
		for (const [name, value] of Object.entries(initial)) {
			cookies.set(name, value);
		}
	}
	return cookies;
}
