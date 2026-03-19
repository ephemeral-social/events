/**
 * In-memory KVNamespace mock for testing session management.
 * Enforces TTL expiration on get().
 */
export class MockKV {
	private store = new Map<string, string>();
	private expirations = new Map<string, number>();

	async get(key: string): Promise<string | null> {
		const expiresAt = this.expirations.get(key);
		if (expiresAt !== undefined && Date.now() >= expiresAt) {
			this.store.delete(key);
			this.expirations.delete(key);
			return null;
		}
		return this.store.get(key) ?? null;
	}

	async put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void> {
		this.store.set(key, value);
		if (opts?.expirationTtl) {
			this.expirations.set(key, Date.now() + opts.expirationTtl * 1000);
		}
	}

	async delete(key: string): Promise<void> {
		this.store.delete(key);
		this.expirations.delete(key);
	}

	async list(): Promise<{ keys: { name: string }[] }> {
		return {
			keys: Array.from(this.store.keys()).map((name) => ({ name }))
		};
	}

	// Test helpers
	getExpirationTtl(key: string): number | undefined {
		const expiresAt = this.expirations.get(key);
		if (expiresAt === undefined) return undefined;
		const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
		return remaining > 0 ? remaining : undefined;
	}

	has(key: string): boolean {
		return this.store.has(key);
	}

	clear(): void {
		this.store.clear();
		this.expirations.clear();
	}
}

export function createMockKV(): MockKV {
	return new MockKV();
}
