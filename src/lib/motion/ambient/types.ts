export interface AmbientRenderer {
	update(): void;
	draw(): void;
	resize?(width: number, height: number): void;
	setThemeColors?(colors: ThemeColors): void;
	destroy?(): void;
}

export interface ThemeColors {
	primary: string;
	secondary: string;
	surface: string;
	accent: string;
}

export interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	opacity: number;
	color: string;
	life: number;
	maxLife: number;
}
