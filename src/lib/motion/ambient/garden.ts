import type { AmbientRenderer, Particle } from './types';

const GARDEN_COLORS = ['#e9b44c', '#c8963e', '#f2d98b', '#d4a843'];
const MAX_PARTICLES = 30;

export function createRenderer(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number
): AmbientRenderer {
	let particles: Particle[] = [];
	let w = width;
	let h = height;
	let time = 0;

	function spawnParticle(): Particle {
		return {
			x: Math.random() * w,
			y: Math.random() * h,
			vx: (Math.random() - 0.5) * 0.15,
			vy: (Math.random() - 0.5) * 0.15,
			size: 2 + Math.random() * 3,
			opacity: 0.1 + Math.random() * 0.15,
			color: GARDEN_COLORS[Math.floor(Math.random() * GARDEN_COLORS.length)],
			life: 0,
			maxLife: 600 + Math.random() * 400
		};
	}

	// Pre-seed
	for (let i = 0; i < 15; i++) {
		const p = spawnParticle();
		p.life = Math.random() * p.maxLife;
		particles.push(p);
	}

	return {
		update() {
			time++;

			if (particles.length < MAX_PARTICLES && Math.random() < 0.04) {
				particles.push(spawnParticle());
			}

			for (const p of particles) {
				p.life++;
				// Gentle wandering motion
				p.x += p.vx + Math.sin(time * 0.005 + p.x * 0.01) * 0.1;
				p.y += p.vy + Math.cos(time * 0.005 + p.y * 0.01) * 0.1;

				// Firefly pulsing opacity
				p.opacity =
					(0.1 + Math.random() * 0.05) *
					(0.5 + 0.5 * Math.sin(time * 0.02 + p.life * 0.03));

				// Wrap around edges
				if (p.x < -10) p.x = w + 10;
				if (p.x > w + 10) p.x = -10;
				if (p.y < -10) p.y = h + 10;
				if (p.y > h + 10) p.y = -10;

				if (p.life > p.maxLife * 0.8) {
					p.opacity *= 0.96;
				}
			}

			particles = particles.filter((p) => p.life < p.maxLife && p.opacity > 0.005);
		},

		draw() {
			ctx.clearRect(0, 0, w, h);

			for (const p of particles) {
				ctx.save();
				ctx.globalAlpha = Math.max(0, p.opacity);
				ctx.fillStyle = p.color;
				// Round glow dot (firefly)
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				ctx.fill();
				// Glow effect
				ctx.globalAlpha = Math.max(0, p.opacity * 0.3);
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			}
		},

		resize(newW: number, newH: number) {
			w = newW;
			h = newH;
		},

		destroy() {
			particles = [];
		}
	};
}
