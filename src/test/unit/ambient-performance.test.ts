// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformanceMonitor } from '$lib/motion/ambient/performance';

describe('PerformanceMonitor', () => {
	let monitor: PerformanceMonitor;
	let performanceNow: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		monitor = new PerformanceMonitor(30, 60);
		performanceNow = vi.spyOn(performance, 'now');
	});

	function simulateFps(fps: number, count: number) {
		const frameTime = 1000 / fps;
		let currentTime = 0;
		for (let i = 0; i < count; i++) {
			performanceNow.mockReturnValue(currentTime);
			monitor.tick();
			currentTime += frameTime;
		}
	}

	it('records frame times and reports non-zero FPS', () => {
		simulateFps(60, 10);
		expect(monitor.getAverageFps()).toBeGreaterThan(0);
	});

	it('handles first tick with no previous frame', () => {
		performanceNow.mockReturnValue(0);
		monitor.tick();
		expect(monitor.getAverageFps()).toBe(0);
	});

	it('computes average FPS correctly for 60fps input', () => {
		simulateFps(60, 61);
		expect(monitor.getAverageFps()).toBeCloseTo(60, 0);
	});

	it('calls onDegrade when avg FPS < 30 but >= 20', () => {
		const degrade = vi.fn();
		const pause = vi.fn();
		monitor.onDegrade(degrade);
		monitor.onPause(pause);

		simulateFps(25, 62);

		expect(degrade).toHaveBeenCalled();
		expect(pause).not.toHaveBeenCalled();
	});

	it('calls onPause when avg FPS < 20', () => {
		const degrade = vi.fn();
		const pause = vi.fn();
		monitor.onDegrade(degrade);
		monitor.onPause(pause);

		simulateFps(15, 62);

		expect(pause).toHaveBeenCalled();
		expect(degrade).not.toHaveBeenCalled();
	});

	it('does not fire callbacks with healthy FPS >= 30', () => {
		const degrade = vi.fn();
		const pause = vi.fn();
		monitor.onDegrade(degrade);
		monitor.onPause(pause);

		simulateFps(60, 62);

		expect(degrade).not.toHaveBeenCalled();
		expect(pause).not.toHaveBeenCalled();
	});

	it('does not fire callbacks before sampleSize frames collected', () => {
		const degrade = vi.fn();
		const pause = vi.fn();
		monitor.onDegrade(degrade);
		monitor.onPause(pause);

		// 59 ticks = only 58 frame times recorded (first tick has no delta)
		// Need 60 frame times to trigger, so 61 ticks total
		simulateFps(25, 59);

		expect(degrade).not.toHaveBeenCalled();
		expect(pause).not.toHaveBeenCalled();
	});

	it('reset clears frame history', () => {
		simulateFps(60, 20);
		expect(monitor.getAverageFps()).toBeGreaterThan(0);

		monitor.reset();
		expect(monitor.getAverageFps()).toBe(0);
	});
});
