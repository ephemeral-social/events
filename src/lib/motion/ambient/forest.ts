import type { AmbientRenderer, Particle } from './types';

const FOREST_COLORS = ['#52b788', '#40916c', '#95d5b2', '#2d6a4f'];
const MAX_PARTICLES = 25;

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
			y: -10,
			vx: (Math.random() - 0.5) * 0.3,
			vy: 0.2 + Math.random() * 0.4,
			size: 3 + Math.random() * 5,
			opacity: 0.15 + Math.random() * 0.25,
			color: FOREST_COLORS[Math.floor(Math.random() * FOREST_COLORS.length)],
			life: 0,
			maxLife: 400 + Math.random() * 200
		};
	}

	// Pre-seed particles at random positions
	for (let i = 0; i < 10; i++) {
		const p = spawnParticle();
		p.y = Math.random() * h;
		p.life = Math.random() * p.maxLife;
		particles.push(p);
	}

	return {
		update() {
			time++;

			// Spawn new particles occasionally
			if (particles.length < MAX_PARTICLES && Math.random() < 0.03) {
				particles.push(spawnParticle());
			}

			// Update each particle
			for (const p of particles) {
				p.life++;
				// Sine wave horizontal sway
				p.x += p.vx + Math.sin(time * 0.01 + p.y * 0.01) * 0.2;
				p.y += p.vy;

				// Fade out near end of life
				if (p.life > p.maxLife * 0.8) {
					p.opacity *= 0.98;
				}
			}

			// Remove dead particles
			particles = particles.filter(
				(p) => p.life < p.maxLife && p.y < h + 20 && p.opacity > 0.01
			);
		},

		draw() {
			ctx.clearRect(0, 0, w, h);

			for (const p of particles) {
				ctx.save();
				ctx.globalAlpha = p.opacity;
				ctx.fillStyle = p.color;
				ctx.translate(p.x, p.y);
				// Leaf-like ellipse via arc + scale (safer cross-browser than ellipse())
				const rotation = Math.sin(time * 0.005 + p.life * 0.02) * 0.5;
				ctx.rotate(rotation);
				ctx.scale(1, 0.5);
				ctx.beginPath();
				ctx.arc(0, 0, p.size, 0, Math.PI * 2);
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
