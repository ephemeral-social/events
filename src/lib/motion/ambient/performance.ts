export class PerformanceMonitor {
	private frameTimes: number[] = [];
	private lastFrameTime = 0;
	private readonly targetFps: number;
	private readonly sampleSize: number;
	private degradeCallback: (() => void) | null = null;
	private pauseCallback: (() => void) | null = null;

	constructor(targetFps = 30, sampleSize = 60) {
		this.targetFps = targetFps;
		this.sampleSize = sampleSize;
	}

	onDegrade(cb: () => void) {
		this.degradeCallback = cb;
	}

	onPause(cb: () => void) {
		this.pauseCallback = cb;
	}

	tick() {
		const now = performance.now();
		if (this.lastFrameTime > 0) {
			this.frameTimes.push(now - this.lastFrameTime);
			if (this.frameTimes.length > this.sampleSize) {
				this.frameTimes.shift();
			}
		}
		this.lastFrameTime = now;

		if (this.frameTimes.length >= this.sampleSize) {
			const avgFrameTime =
				this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
			const avgFps = 1000 / avgFrameTime;

			if (avgFps < 20) {
				this.pauseCallback?.();
			} else if (avgFps < this.targetFps) {
				this.degradeCallback?.();
			}
		}
	}

	getAverageFps(): number {
		if (this.frameTimes.length === 0) return 0;
		const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
		return 1000 / avg;
	}

	reset() {
		this.frameTimes = [];
		this.lastFrameTime = 0;
	}
}
