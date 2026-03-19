declare module 'culori' {
	export function oklch(color: unknown): { l?: number; c?: number; h?: number } | undefined;
	export function parse(input: string): unknown;
	export function formatHex(color: unknown): string;
	export function converter(
		mode: string
	): (color: unknown) => { r: number; g: number; b: number } | undefined;
}
