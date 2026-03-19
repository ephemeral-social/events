// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('device-tier', () => {
	beforeEach(() => {
		vi.resetModules();
		// Default: motionOk returns true
		vi.doMock('$lib/motion/utils/reduced-motion.svelte', () => ({
			motionOk: vi.fn(() => true)
		}));
	});

	function setHardwareConcurrency(cores: number) {
		Object.defineProperty(navigator, 'hardwareConcurrency', {
			value: cores,
			configurable: true
		});
	}

	function setConnectionSaveData(saveData: boolean) {
		Object.defineProperty(navigator, 'connection', {
			value: { saveData },
			configurable: true
		});
	}

	function clearConnection() {
		Object.defineProperty(navigator, 'connection', {
			value: undefined,
			configurable: true
		});
	}

	it('returns "medium" on SSR (navigator undefined)', async () => {
		// Temporarily remove navigator
		const origNav = globalThis.navigator;
		// @ts-expect-error - intentionally removing navigator for SSR test
		delete globalThis.navigator;

		const { getDeviceTier } = await import('$lib/motion/utils/device-tier');
		expect(getDeviceTier()).toBe('medium');

		globalThis.navigator = origNav;
	});

	it('returns "low" when concurrency <= 2', async () => {
		setHardwareConcurrency(2);
		clearConnection();
		const { getDeviceTier } = await import('$lib/motion/utils/device-tier');
		expect(getDeviceTier()).toBe('low');
	});

	it('returns "low" when connection.saveData = true', async () => {
		setHardwareConcurrency(8);
		setConnectionSaveData(true);
		const { getDeviceTier } = await import('$lib/motion/utils/device-tier');
		expect(getDeviceTier()).toBe('low');
	});

	it('returns "high" when concurrency >= 4', async () => {
		setHardwareConcurrency(4);
		clearConnection();
		const { getDeviceTier } = await import('$lib/motion/utils/device-tier');
		expect(getDeviceTier()).toBe('high');
	});

	it('returns "medium" for intermediate values (3 cores)', async () => {
		setHardwareConcurrency(3);
		clearConnection();
		const { getDeviceTier } = await import('$lib/motion/utils/device-tier');
		expect(getDeviceTier()).toBe('medium');
	});

	it('caches result after first call', async () => {
		setHardwareConcurrency(8);
		clearConnection();
		const { getDeviceTier } = await import('$lib/motion/utils/device-tier');
		const first = getDeviceTier();

		// Change hardware — should return cached value
		setHardwareConcurrency(1);
		const second = getDeviceTier();
		expect(second).toBe(first);
	});

	it('supportsAmbientEffects() true when high + motionOk', async () => {
		setHardwareConcurrency(8);
		clearConnection();
		vi.doMock('$lib/motion/utils/reduced-motion.svelte', () => ({
			motionOk: vi.fn(() => true)
		}));
		const { supportsAmbientEffects } = await import('$lib/motion/utils/device-tier');
		expect(supportsAmbientEffects()).toBe(true);
	});

	it('supportsAmbientEffects() false when high + !motionOk', async () => {
		setHardwareConcurrency(8);
		clearConnection();
		vi.doMock('$lib/motion/utils/reduced-motion.svelte', () => ({
			motionOk: vi.fn(() => false)
		}));
		const { supportsAmbientEffects } = await import('$lib/motion/utils/device-tier');
		expect(supportsAmbientEffects()).toBe(false);
	});

	it('supportsAmbientEffects() false when not high tier', async () => {
		setHardwareConcurrency(2);
		clearConnection();
		vi.doMock('$lib/motion/utils/reduced-motion.svelte', () => ({
			motionOk: vi.fn(() => true)
		}));
		const { supportsAmbientEffects } = await import('$lib/motion/utils/device-tier');
		expect(supportsAmbientEffects()).toBe(false);
	});
});
