<script lang="ts">
	import { getDraft, updateDraft, publishEvent, saveEvent, validateDraft, getFieldErrors } from '$lib/stores/event-draft.svelte';
	import { VALID_AESTHETICS, VALID_PALETTES, PALETTE_COLORS } from '$lib/themes/types';
	import type { EventAesthetic } from '$lib/themes/types';
	import { goto } from '$app/navigation';
	import { Gear, X } from 'phosphor-svelte';
	import EditorSettings from './EditorSettings.svelte';
	import SaveStatusIndicator from './SaveStatusIndicator.svelte';

	const SETTINGS_FIELDS = ['max_attendees', 'ticket_price_cents'];

	interface Props {
		mode: 'create' | 'edit';
		onCancel?: () => void;
	}

	let { mode, onCancel }: Props = $props();

	const draft = $derived(getDraft());
	const fieldErrors = $derived(getFieldErrors());
	const hasSettingsErrors = $derived(SETTINGS_FIELDS.some((f) => fieldErrors[f]));
	const palettes = $derived(VALID_PALETTES[draft.aesthetic]);
	let settingsOpen = $state(false);
	let isPublishing = $state(false);

	// Hue picker state
	let hueBarEl: HTMLDivElement | undefined = $state();
	let isDraggingHue = $state(false);

	const aestheticLabels: Record<string, string> = {
		simple: 'Simple',
		fun: 'Fun',
		warm: 'Warm',
		elegant: 'Elegant'
	};

	const aestheticFonts: Record<string, string> = {
		simple: "'Inter', sans-serif",
		fun: "'Manrope Variable', 'Manrope', sans-serif",
		warm: "'Cormorant Garamond', serif",
		elegant: "'Cormorant Garamond', serif"
	};

	const aestheticWeights: Record<string, number> = {
		simple: 600,
		fun: 800,
		warm: 300,
		elegant: 300
	};

	const aestheticSizes: Record<string, string> = {
		simple: '0.8125rem',
		fun: '0.8125rem',
		warm: '0.9375rem',
		elegant: '0.9375rem'
	};

	function selectAesthetic(a: EventAesthetic) {
		updateDraft('aesthetic', a);
	}

	function selectPalette(p: string) {
		updateDraft('palette', p);
	}

	function toggleMode() {
		updateDraft('mode', draft.mode === 'dark' ? 'light' : 'dark');
	}

	// Hue picker — compute hue from pointer position on the bar
	function hueFromPointer(e: MouseEvent | TouchEvent) {
		if (!hueBarEl) return;
		const rect = hueBarEl.getBoundingClientRect();
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
		const hue = Math.round((x / rect.width) * 360);
		updateDraft('accent_hue', hue);
	}

	function handleHueBarDown(e: MouseEvent | TouchEvent) {
		isDraggingHue = true;
		hueFromPointer(e);
		if ('touches' in e) {
			window.addEventListener('touchmove', handleHueBarMove, { passive: false });
			window.addEventListener('touchend', handleHueBarUp);
		} else {
			window.addEventListener('mousemove', handleHueBarMove);
			window.addEventListener('mouseup', handleHueBarUp);
		}
	}

	function handleHueBarMove(e: MouseEvent | TouchEvent) {
		if (!isDraggingHue) return;
		e.preventDefault();
		hueFromPointer(e);
	}

	function handleHueBarUp() {
		isDraggingHue = false;
		window.removeEventListener('mousemove', handleHueBarMove);
		window.removeEventListener('mouseup', handleHueBarUp);
		window.removeEventListener('touchmove', handleHueBarMove);
		window.removeEventListener('touchend', handleHueBarUp);
	}

	function resetHue() {
		updateDraft('accent_hue', null);
	}

	const currentHue = $derived(draft.accent_hue ?? 150);
	const thumbPosition = $derived(`${(currentHue / 360) * 100}%`);
	const accentPreviewColor = $derived(`oklch(0.70 0.18 ${currentHue})`);

	async function handlePublish() {
		if (isPublishing) return;

		// Validate before submitting
		if (!validateDraft()) {
			// Auto-open settings if errors are in the settings panel
			if (hasSettingsErrors) settingsOpen = true;
			return;
		}

		isPublishing = true;
		if (mode === 'edit') {
			await saveEvent();
			isPublishing = false;
		} else {
			const result = await publishEvent();
			isPublishing = false;
			if (result) {
				// Always go to invite step first — for ticketed events,
				// invite SMS is deferred until Stripe setup completes
				goto(`/e/${result.slug}?invite=1`);
			}
		}
	}
</script>

<div class="editor-toolbar" data-testid="editor-toolbar">
	<div class="toolbar-row">
		{#each VALID_AESTHETICS as aesthetic (aesthetic)}
			<button
				class="aesthetic-btn"
				class:active={draft.aesthetic === aesthetic}
				data-testid="aesthetic-btn-{aesthetic}"
				style="font-family: {aestheticFonts[aesthetic]}; font-weight: {aestheticWeights[aesthetic]}; font-size: {aestheticSizes[aesthetic]}"
				onclick={() => selectAesthetic(aesthetic)}
			>
				{aestheticLabels[aesthetic]}
			</button>
		{/each}
	</div>

	<div class="toolbar-row">
		{#each palettes as palette (palette)}
			<button
				class="palette-swatch palette-{palette}"
				class:active={draft.palette === palette}
				data-testid="palette-swatch-{palette}"
				onclick={() => selectPalette(palette)}
				title={palette}
			>
				<span
					class="swatch-dot"
					style="background: {PALETTE_COLORS[draft.aesthetic]?.[palette] || '#a39e96'}"
				></span>
			</button>
		{/each}
	</div>

	<div class="toolbar-row controls-row">
		{#if onCancel}
			<button
				class="cancel-btn"
				data-testid="cancel-btn"
				onclick={onCancel}
				title="Cancel"
			>
				<X size={18} weight="bold" />
			</button>
		{/if}

		<button
			class="mode-toggle"
			data-testid="mode-toggle"
			onclick={toggleMode}
		>
			{draft.mode === 'dark' ? 'Dark' : 'Light'}
		</button>

		<!-- Hue spectrum bar -->
		<div class="hue-picker-group">
			<div
				class="hue-bar"
				data-testid="hue-slider"
				bind:this={hueBarEl}
				role="slider"
				tabindex="0"
				aria-label="Accent hue"
				aria-valuemin={0}
				aria-valuemax={360}
				aria-valuenow={currentHue}
				onmousedown={handleHueBarDown}
				ontouchstart={handleHueBarDown}
			>
				<div class="hue-thumb" style="left: {thumbPosition}"></div>
			</div>
			<div class="hue-preview" style="background: {accentPreviewColor}"></div>
			{#if draft.accent_hue !== null}
				<button class="hue-reset" onclick={resetHue} title="Reset to palette default">
					<X size={12} weight="bold" />
				</button>
			{/if}
		</div>

		<button
			class="settings-btn"
			data-testid="settings-btn"
			onclick={() => (settingsOpen = true)}
		>
			<Gear size={20} />
			{#if hasSettingsErrors}
				<span class="settings-error-dot"></span>
			{/if}
		</button>

		<SaveStatusIndicator />

		<button
			class="publish-btn"
			data-testid="publish-btn"
			onclick={handlePublish}
			disabled={isPublishing}
		>
			{mode === 'create' ? 'Publish' : 'Save'}
		</button>
	</div>
</div>

<EditorSettings open={settingsOpen} onClose={() => (settingsOpen = false)} />

<style>
	.editor-toolbar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background: #111110;
		border-top: 1px solid #2e2c2a;
		padding: 8px 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.toolbar-row {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.controls-row {
		justify-content: space-between;
	}

	.aesthetic-btn {
		flex: 1;
		padding: 6px 12px;
		border: 1px solid #2e2c2a;
		border-radius: 9999px;
		background: transparent;
		color: #a39e96;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.aesthetic-btn.active {
		background: #52b788;
		color: #111110;
		border-color: #52b788;
	}

	.palette-swatch {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 2px solid #2e2c2a;
		background: #232220;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 150ms ease;
		padding: 0;
	}

	.palette-swatch.active {
		border-color: #52b788;
	}

	.swatch-dot {
		width: 16px;
		height: 16px;
		border-radius: 50%;
	}

	.cancel-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 9999px;
		border: 1px solid #2e2c2a;
		background: transparent;
		color: #a39e96;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.cancel-btn:hover {
		border-color: #e85d04;
		color: #e85d04;
	}

	.mode-toggle {
		padding: 4px 12px;
		border: 1px solid #2e2c2a;
		border-radius: 9999px;
		background: transparent;
		color: #a39e96;
		font-family: 'Manrope Variable', sans-serif;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 150ms ease;
	}

	/* Hue spectrum bar */
	.hue-picker-group {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
		max-width: 140px;
	}

	.hue-bar {
		position: relative;
		flex: 1;
		height: 16px;
		border-radius: 8px;
		background: linear-gradient(
			to right,
			hsl(0, 100%, 50%),
			hsl(60, 100%, 50%),
			hsl(120, 100%, 50%),
			hsl(180, 100%, 50%),
			hsl(240, 100%, 50%),
			hsl(300, 100%, 50%),
			hsl(360, 100%, 50%)
		);
		cursor: pointer;
		touch-action: none;
		outline: none;
	}

	.hue-bar:focus-visible {
		box-shadow: 0 0 0 2px #52b788;
	}

	.hue-thumb {
		position: absolute;
		top: 50%;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #fff;
		border: 2px solid #111110;
		box-shadow: 0 0 3px rgba(0, 0, 0, 0.4);
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.hue-preview {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		flex-shrink: 0;
		border: 1px solid #2e2c2a;
	}

	.hue-reset {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 1px solid #2e2c2a;
		background: transparent;
		color: #6b6560;
		cursor: pointer;
		padding: 0;
		flex-shrink: 0;
		transition: all 150ms ease;
	}

	.hue-reset:hover {
		border-color: #a39e96;
		color: #a39e96;
	}

	.settings-btn {
		background: none;
		border: none;
		color: #a39e96;
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		position: relative;
	}

	.settings-error-dot {
		position: absolute;
		top: 0;
		right: -2px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #e85d04;
	}

	.publish-btn {
		padding: 6px 20px;
		border: none;
		border-radius: 9999px;
		background: #52b788;
		color: #111110;
		font-family: 'Manrope Variable', sans-serif;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.publish-btn:hover {
		background: #40916c;
	}

	.publish-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
