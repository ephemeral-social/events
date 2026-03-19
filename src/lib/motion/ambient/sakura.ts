import type { AmbientRenderer, Particle } from './types';

const SAKURA_COLORS = ['#f4a0b5', '#e07a93', '#fcd5e0', '#f8c8d8'];
const MAX_PARTICLES = 20;

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
			vx: (Math.random() - 0.5) * 0.5,
			vy: 0.15 + Math.random() * 0.3,
			size: 4 + Math.random() * 6,
			opacity: 0.12 + Math.random() * 0.2,
			color: SAKURA_COLORS[Math.floor(Math.random() * SAKURA_COLORS.length)],
			life: 0,
			maxLife: 500 + Math.random() * 300
		};
	}

	// Pre-seed
	for (let i = 0; i < 8; i++) {
		const p = spawnParticle();
		p.y = Math.random() * h;
		p.life = Math.random() * p.maxLife;
		particles.push(p);
	}

	return {
		update() {
			time++;

			if (particles.length < MAX_PARTICLES && Math.random() < 0.025) {
				particles.push(spawnParticle());
			}

			for (const p of particles) {
				p.life++;
				// More horizontal drift for sakura
				p.x += p.vx + Math.sin(time * 0.008 + p.y * 0.008) * 0.3;
				p.y += p.vy;

				if (p.life > p.maxLife * 0.8) {
					p.opacity *= 0.97;
				}
			}

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
				// Petal shape via arc + scale (safer cross-browser than ellipse())
				const rotation = Math.sin(time * 0.003 + p.life * 0.015) * 0.8;
				ctx.rotate(rotation);
				ctx.scale(1, 0.6);
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
