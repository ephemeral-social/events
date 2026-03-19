<script lang="ts">
	import { Check } from 'phosphor-svelte';
	import type { EventTheme, EventMode } from '$lib/themes/types';
	import { getThemeTokens } from '$lib/themes/tokens';
	import { hexToAccentHue, computeAccentPrimary } from '$lib/themes/accent';
	import { hapticLight } from '$lib/utils/haptics';

	interface Props {
		accentHue: number | null;
		theme: EventTheme;
		mode: EventMode;
		onchange: (hue: number | null) => void;
	}

	let { accentHue, theme, mode, onchange }: Props = $props();

	let hexInput = $state('');

	const PRESETS: { label: string; hue: number }[] = [
		{ label: 'Rose', hue: 12 },
		{ label: 'Tangerine', hue: 45 },
		{ label: 'Gold', hue: 85 },
		{ label: 'Forest', hue: 150 },
		{ label: 'Teal', hue: 185 },
		{ label: 'Azure', hue: 245 },
		{ label: 'Violet', hue: 290 },
		{ label: 'Orchid', hue: 325 }
	];

	const tokens = $derived(getThemeTokens(theme, mode));

	function isDefaultSelected(): boolean {
		return accentHue === null;
	}

	function isPresetSelected(hue: number): boolean {
		return accentHue === hue;
	}

	function presetColor(hue: number): string {
		return computeAccentPrimary(hue, mode);
	}

	function handleHexBlur() {
		const trimmed = hexInput.trim();
		if (!trimmed) return;
		const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
		if (/^#[0-9a-fA-F]{3,8}$/.test(normalized)) {
			const hue = hexToAccentHue(normalized);
			onchange(hue);
		}
		hexInput = '';
	}

	function handleHexKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
		}
	}
</script>

<div class="accent-picker">
	<div class="swatches-row">
		<!-- Default swatch -->
		<button
			class="accent-swatch"
			class:selected={isDefaultSelected()}
			type="button"
			aria-label="Default accent color"
			aria-pressed={isDefaultSelected()}
			onclick={() => { hapticLight(); onchange(null); }}
		>
			<div
				class="accent-circle"
				style="background: {tokens.primary};"
			>
				{#if isDefaultSelected()}
					<Check size={12} weight="bold" color={tokens.primaryForeground} />
				{/if}
			</div>
			<span class="accent-label">Default</span>
		</button>

		<!-- Preset swatches -->
		{#each PRESETS as preset (preset.hue)}
			<button
				class="accent-swatch"
				class:selected={isPresetSelected(preset.hue)}
				type="button"
				aria-label="{preset.label} accent color"
				aria-pressed={isPresetSelected(preset.hue)}
				onclick={() => { hapticLight(); onchange(preset.hue); }}
			>
				<div
					class="accent-circle"
					style="background: {presetColor(preset.hue)};"
				>
					{#if isPresetSelected(preset.hue)}
						<Check size={12} weight="bold" color="oklch(0.98 0.01 {preset.hue})" />
					{/if}
				</div>
				<span class="accent-label">{preset.label}</span>
			</button>
		{/each}
	</div>

	<!-- Hex input -->
	<div class="hex-input-row">
		<label for="accent-hex" class="hex-label">Custom</label>
		<div class="hex-field-wrap">
			<span class="hex-prefix">#</span>
			<input
				id="accent-hex"
				type="text"
				class="hex-input"
				placeholder="52b788"
				maxlength={7}
				bind:value={hexInput}
				onblur={handleHexBlur}
				onkeydown={handleHexKeydown}
			/>
		</div>
	</div>
</div>

<style>
	.accent-picker {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.swatches-row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.accent-swatch {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.accent-circle {
		width: 32px;
		height: 32px;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid transparent;
		transition: all 150ms ease;
	}

	.accent-swatch:hover .accent-circle {
		transform: scale(1.1);
	}

	.accent-swatch.selected .accent-circle {
		box-shadow: 0 0 0 2px var(--surface-base), 0 0 0 4px var(--accent-primary);
	}

	.accent-label {
		font-size: 0.625rem;
		line-height: 1;
		color: var(--text-muted);
		font-family: var(--font-body);
	}

	.accent-swatch.selected .accent-label {
		color: var(--text-secondary);
	}

	.hex-input-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.hex-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-family: var(--font-body);
		white-space: nowrap;
	}

	.hex-field-wrap {
		display: flex;
		align-items: center;
		gap: 0;
		border: 1px solid var(--border-subtle);
		border-radius: 9999px;
		background: var(--surface-card);
		padding: 4px 10px;
		transition: border-color 150ms ease;
	}

	.hex-field-wrap:focus-within {
		border-color: var(--border-focus, var(--accent-primary));
	}

	.hex-prefix {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-family: var(--font-body);
		line-height: 1;
	}

	.hex-input {
		width: 5.5ch;
		border: none;
		background: transparent;
		color: var(--text-primary);
		font-size: 0.75rem;
		font-family: var(--font-body);
		outline: none;
		line-height: 1;
		padding: 0;
	}

	.hex-input::placeholder {
		color: var(--text-muted);
	}
</style>
