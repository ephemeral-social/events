<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Calendar, Clock, MapPin, Users, ShareNetwork, CalendarPlus, Camera, LinkSimple, Palette, X as XIcon } from 'phosphor-svelte';
	import { formatDate, formatTime, formatGuestCount } from '$lib/utils/aesthetic-formatters';
	import { AESTHETIC_COPY } from '$lib/utils/aesthetic-copy';
	import { getCoverImageUrl, isCoverVideo } from '$lib/utils/event-helpers';
	import { scrollReveal, pressFeedback } from '$lib/motion';
	import InlineTextInput from '$lib/components/editor/InlineTextInput.svelte';
	import EditableDescription from '$lib/components/editor/EditableDescription.svelte';
	import ExpandableDescription from '$lib/components/event/ExpandableDescription.svelte';
	import CoverUploadIndicator from '$lib/components/editor/CoverUploadIndicator.svelte';
	import { getCoverUploadStatus, getFieldErrors } from '$lib/stores/event-draft.svelte';
	import { openTawkChat } from '$lib/utils/tawk';
	import { toLocalDatetime } from '$lib/utils/datetime';
	import InspoDialog from '$lib/components/event/InspoDialog.svelte';
	import PinterestBoardPicker from '$lib/components/event/PinterestBoardPicker.svelte';
	import { getInspoType, isPinterestBoardEntry, type InspoItem, type PinterestBoardEntry } from '$lib/utils/inspo';

	interface Props {
		event: Record<string, any>;
		host: { user_id: string; username?: string; display_name?: string; avatar_r2_key?: string | null } | null;
		rsvpCounts: { going: number; maybe: number };
		editMode?: boolean;
		showRsvpBar?: boolean;
		rsvpScrolled?: boolean;
		onRsvp?: (status: string) => void;
		onViewGuests?: () => void;
		onShare?: () => void;
		onDownloadCalendar?: () => void;
		onUpdateField?: (field: string, value: any) => void;
		onUploadCover?: (file: File) => void;
		ctaSlot?: Snippet;
	}

	let {
		event,
		host,
		rsvpCounts,
		editMode = false,
		showRsvpBar = true,
		rsvpScrolled = false,
		onRsvp,
		onViewGuests,
		onShare,
		onDownloadCalendar,
		onUpdateField,
		onUploadCover,
		ctaSlot
	}: Props = $props();

	const copy = AESTHETIC_COPY.rsvp.simple;
	const hostCopy = AESTHETIC_COPY.host.simple;

	const startDate = $derived(event.start_time ? new Date(event.start_time) : new Date());
	const dateStr = $derived(formatDate(startDate, 'simple'));
	const timeStr = $derived(formatTime(startDate, 'simple'));
	const guestStr = $derived(formatGuestCount(rsvpCounts.going, rsvpCounts.maybe, 'simple'));
	const coverUrl = $derived(getCoverImageUrl(event.cover_r2_key));
	const isVideo = $derived(event.cover_is_video || isCoverVideo(event.cover_r2_key));
	const hostName = $derived(host?.display_name || 'Someone');
	const uploadStatus = $derived(getCoverUploadStatus());
	const fieldErrors = $derived(getFieldErrors());

	// Inspo board state
	let inspoDialogOpen = $state(false);
	let boardPickerOpen = $state(false);
	let inspoItems = $derived((event.inspo_urls || []) as InspoItem[]);
	let hasRecognizedInspo = $derived(
		inspoItems.some((item: InspoItem) => getInspoType(item) !== 'unknown')
	);

	// Auto-open board picker when returning from Pinterest OAuth
	$effect(() => {
		if (editMode) {
			const params = new URLSearchParams(window.location.search);
			if (params.has('pinterest_connected') || params.has('pinterest_picker')) {
				boardPickerOpen = true;
			}
		}
	});

	function removeInspoItem(index: number) {
		const updated = inspoItems.filter((_: InspoItem, i: number) => i !== index);
		onUpdateField?.('inspo_urls', updated);
	}
	function addInspoUrl() {
		onUpdateField?.('inspo_urls', [...inspoItems, '']);
	}
	function addPinterestBoards(boards: PinterestBoardEntry[]) {
		onUpdateField?.('inspo_urls', [...inspoItems, ...boards]);
	}

	function handleCoverFileSelect(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) onUploadCover?.(file);
	}

	function openSupport() {
		openTawkChat();
	}
</script>

<article class="simple-layout" data-testid="simple-layout">
	<!-- Main viewport section: details + branding -->
	<div class="simple-viewport">
		<div class="simple-content">
			<!-- Cover image -->
			{#if coverUrl || event.cover_preview_url || (editMode && onUploadCover)}
				<div class="simple-cover-wrapper" data-animate="cover">
					{#if event.cover_preview_url || coverUrl}
						{#if isVideo}
							<!-- svelte-ignore a11y_media_has_caption -->
							<video
								src={event.cover_preview_url || coverUrl}
								autoplay
								muted
								loop
								playsinline
								class="simple-cover"
							></video>
						{:else}
							<img src={event.cover_preview_url || coverUrl} alt="" class="simple-cover" aria-hidden="true" />
						{/if}
					{/if}
					{#if editMode && onUploadCover}
						<label class="cover-change-btn" aria-label="Change cover image">
							<input type="file" accept="image/*,video/*" class="sr-only" onchange={handleCoverFileSelect} />
							<Camera size={14} weight="regular" />
						</label>
					{/if}
					{#if editMode}
						<CoverUploadIndicator status={uploadStatus} />
					{/if}
				</div>
			{/if}

			<!-- Event title -->
			{#if editMode}
				<InlineTextInput
					value={event.title === 'Untitled Event' ? '' : event.title}
					oninput={(v) => onUpdateField?.('title', v)}
					placeholder="Event name"
					class="simple-title"
					error={fieldErrors.title || ''}
				/>
			{:else}
				<h1 class="simple-title" use:scrollReveal={{ y: 12 }}>{event.title}</h1>
			{/if}

			<!-- Accent detail line -->
			<div class="simple-accent-line"></div>

			<!-- Date -->
			<div class="simple-info-row">
				<Calendar size={15} weight="regular" class="simple-icon" />
				{#if editMode}
					<div class="simple-field-col">
						<input
							type="datetime-local"
							class="layout-date-input simple-info-text"
							class:input-error={fieldErrors.start_time}
							value={toLocalDatetime(event.start_time)}
							onchange={(e) => {
								const v = e.currentTarget.value;
								onUpdateField?.('start_time', v ? new Date(v).toISOString() : null);
							}}
						/>
						{#if fieldErrors.start_time}
							<span class="field-error">{fieldErrors.start_time}</span>
						{/if}
					</div>
				{:else}
					<span class="simple-info-text">{dateStr}</span>
				{/if}
			</div>

			<!-- Time -->
			<div class="simple-info-row">
				<Clock size={15} weight="regular" class="simple-icon" />
				{#if editMode}
					<div class="simple-field-col">
						<input
							type="datetime-local"
							class="layout-date-input simple-info-text"
							class:input-error={fieldErrors.end_time}
							value={toLocalDatetime(event.end_time)}
							onchange={(e) => {
								const v = e.currentTarget.value;
								onUpdateField?.('end_time', v ? new Date(v).toISOString() : null);
							}}
						/>
						{#if fieldErrors.end_time}
							<span class="field-error">{fieldErrors.end_time}</span>
						{/if}
					</div>
				{:else}
					<span class="simple-info-text">{timeStr}</span>
				{/if}
			</div>

			<!-- Location -->
			{#if editMode || event.venue_name || event.venue_address}
				<div class="simple-info-row">
					<MapPin size={15} weight="regular" class="simple-icon" />
					<div>
						{#if editMode}
							<InlineTextInput
								value={event.venue_name || ''}
								oninput={(v) => onUpdateField?.('venue_name', v)}
								placeholder="Venue name"
								class="simple-info-text simple-info-venue"
							/>
							<InlineTextInput
								value={event.venue_address || ''}
								oninput={(v) => onUpdateField?.('venue_address', v)}
								placeholder="Address"
								class="simple-info-address"
							/>
						{:else}
							<span class="simple-info-text simple-info-venue">{event.venue_name}</span>
							{#if event.venue_address}
								<span class="simple-info-address">{event.venue_address}</span>
							{/if}
						{/if}
					</div>
				</div>
			{:else if event.location_hidden}
				<div class="simple-info-row">
					<MapPin size={15} weight="regular" class="simple-icon simple-icon-muted" />
					<span class="simple-info-text simple-info-muted" data-testid="location-hidden-message">Location revealed after RSVP</span>
				</div>
			{/if}

			<!-- Custom link -->
			{#if editMode}
				<div class="simple-info-row">
					<LinkSimple size={15} weight="regular" class="simple-icon" />
					<div class="simple-field-col">
						<InlineTextInput
							value={event.link_url || ''}
							oninput={(v) => onUpdateField?.('link_url', v)}
							placeholder="https://..."
							class="simple-info-text"
						/>
						<InlineTextInput
							value={event.link_title || ''}
							oninput={(v) => onUpdateField?.('link_title', v)}
							placeholder="Link text (optional)"
							class="simple-info-address"
						/>
					</div>
				</div>
			{:else if event.link_url}
				<div class="simple-info-row">
					<LinkSimple size={15} weight="regular" class="simple-icon" />
					<a href={event.link_url} target="_blank" rel="noopener noreferrer" class="simple-link">
						{event.link_title || event.link_url}
					</a>
				</div>
			{/if}

			<!-- Inspo boards -->
			{#if editMode}
				{#each inspoItems as item, i}
					{#if isPinterestBoardEntry(item)}
						<div class="simple-info-row">
							<Palette size={15} weight="regular" class="simple-icon" />
							<span class="simple-info-text" style="flex:1; opacity:0.8;">📌 {item.name}</span>
							<button
								type="button"
								class="simple-icon"
								style="cursor:pointer; background:none; border:none; padding:2px;"
								onclick={() => removeInspoItem(i)}
								aria-label="Remove Pinterest board"
							>
								<XIcon size={12} weight="bold" />
							</button>
						</div>
					{:else if typeof item === 'string'}
						<div class="simple-info-row">
							<Palette size={15} weight="regular" class="simple-icon" />
							<div class="simple-field-col" style="flex:1">
								<InlineTextInput
									value={item}
									oninput={(v) => {
										const updated = [...inspoItems];
										updated[i] = v;
										onUpdateField?.('inspo_urls', updated);
									}}
									placeholder="Google Slides URL"
									class="simple-info-text"
								/>
							</div>
							<button
								type="button"
								class="simple-icon"
								style="cursor:pointer; background:none; border:none; padding:2px;"
								onclick={() => removeInspoItem(i)}
								aria-label="Remove inspo URL"
							>
								<XIcon size={12} weight="bold" />
							</button>
						</div>
					{/if}
				{/each}
				{#if inspoItems.length < 3}
					<div class="simple-info-row" style="display:flex; gap:12px;">
						<Palette size={15} weight="regular" class="simple-icon" />
						<button
							type="button"
							style="cursor:pointer; background:none; border:none; padding:0; font:inherit;"
							onclick={() => { boardPickerOpen = true; }}
						>
							<span class="simple-info-text" style="color:var(--text-muted)">+ Pinterest board</span>
						</button>
						<span style="color:var(--border-default)">|</span>
						<button
							type="button"
							style="cursor:pointer; background:none; border:none; padding:0; font:inherit;"
							onclick={addInspoUrl}
						>
							<span class="simple-info-text" style="color:var(--text-muted)">+ Google Slides</span>
						</button>
					</div>
				{/if}
			{:else if hasRecognizedInspo}
				<div class="simple-info-row">
					<Palette size={15} weight="regular" class="simple-icon" />
					<button
						type="button"
						class="simple-link"
						style="cursor:pointer; background:none; border:none; padding:0; font:inherit;"
						onclick={() => { inspoDialogOpen = true; }}
					>
						View Inspo Board
					</button>
				</div>
			{/if}

			<hr class="simple-divider" />

			<!-- Description -->
			{#if editMode}
				<EditableDescription
					value={event.description || ''}
					oninput={(v) => onUpdateField?.('description', v)}
					placeholder="Add a description..."
					error={fieldErrors.description || ''}
				/>
			{:else if event.description}
				<ExpandableDescription text={event.description} class="simple-description" />
			{/if}

			{#if event.description || editMode}
				<hr class="simple-divider" />
			{/if}

			<!-- Guest count + Host attribution -->
			<div class="simple-meta-row">
				<div class="simple-info-row">
					<Users size={15} weight="regular" class="simple-icon" />
					<span class="simple-guest-count">{guestStr}</span>
					{#if onViewGuests}
						<button class="simple-guest-view-link" onclick={onViewGuests}>View</button>
					{/if}
				</div>
				<p class="simple-host" data-testid="host-attribution">
					Hosted by <span class="simple-host-name">{hostName}</span>
				</p>
			</div>

			<!-- RSVP section -- inline, not floating -->
			{#if showRsvpBar && !editMode}
				<div class="simple-rsvp" data-testid="rsvp-buttons" data-animate="cta">
					<button class="simple-btn simple-btn-primary" use:pressFeedback onclick={() => onRsvp?.('going')}>
						{copy.going}
					</button>
					<div class="simple-rsvp-secondary">
						<button class="simple-maybe-link" use:pressFeedback onclick={() => onRsvp?.('maybe')}>
							{copy.maybe}
						</button>
						<button class="simple-decline-link" use:pressFeedback onclick={() => onRsvp?.('declined')}>
							{copy.decline}
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Branding — always at very bottom of viewport -->
		<div class="simple-branding-row">
			<a href="/" class="simple-branding">
				<span>powered by</span>
				<img src="/landing/logo-full-white.png" alt="Ephemeral" class="simple-branding-logo" />
			</a>
			<span class="simple-branding-sep" aria-hidden="true"></span>
			<button class="simple-branding-support" onclick={openSupport}>Support</button>
		</div>
	</div>

	<!-- Below fold: action buttons + CTA slot -->
	{#if !editMode && (onShare || onDownloadCalendar)}
		<div class="simple-below-fold">
			<div class="simple-actions" use:scrollReveal={{ y: 10 }}>
				{#if onDownloadCalendar}
					<button class="simple-action-btn" use:pressFeedback onclick={onDownloadCalendar}>
						<CalendarPlus size={16} weight="regular" />
						<span>Add to Calendar</span>
					</button>
				{/if}
				{#if onShare}
					<button class="simple-action-btn" use:pressFeedback onclick={onShare} aria-label="Share event">
						<ShareNetwork size={16} weight="regular" />
						<span>Share</span>
					</button>
				{/if}
			</div>
		</div>
	{/if}

	{#if ctaSlot}
		{@render ctaSlot()}
	{/if}
</article>

<InspoDialog open={inspoDialogOpen} items={inspoItems} hostUserId={host?.user_id || ''} onClose={() => { inspoDialogOpen = false; }} />

{#if editMode}
	<PinterestBoardPicker
		open={boardPickerOpen}
		maxSelectable={3 - inspoItems.length}
		onClose={() => { boardPickerOpen = false; }}
		onSelect={addPinterestBoards}
	/>
{/if}

<style>
	.simple-layout {
		background:
			radial-gradient(ellipse at 50% 0%, color-mix(in oklch, var(--primary) 6%, var(--background)) 0%, var(--background) 60%),
			var(--background);
		color: var(--color-fg, var(--foreground));
		font-family: var(--font-body, 'DM Sans', sans-serif);
	}

	/* Viewport-height section: details fill top, branding at bottom */
	.simple-viewport {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.simple-content {
		max-width: 520px;
		width: 100%;
		margin: 0 auto;
		padding: 32px 20px 0;
	}

	@media (min-width: 640px) {
		.simple-content {
			padding: 40px 32px 0;
		}
	}

	/* ── Cover ──────────────────────────────────────────────────── */

	.simple-cover-wrapper {
		position: relative;
		margin-bottom: 20px;
		border-radius: var(--radius-card, 10px);
		overflow: hidden;
		min-height: 120px;
	}

	.simple-cover {
		width: 100%;
		max-height: 180px;
		object-fit: cover;
		border-radius: var(--radius-card, 10px);
	}

	.cover-change-btn {
		position: absolute;
		top: 8px;
		right: 8px;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.5);
		color: var(--color-fg, var(--foreground, #ede9e3));
		cursor: pointer;
		transition: background var(--motion-duration-standard, 200ms) var(--motion-ease, ease);
		backdrop-filter: blur(8px);
	}

	.cover-change-btn:hover {
		background: rgba(0, 0, 0, 0.7);
	}

	.cover-change-btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.simple-cover-wrapper:not(:has(.simple-cover)) {
		border: 2px dashed var(--color-border, var(--border, #2e2c2a));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.simple-cover-wrapper:not(:has(.simple-cover)) .cover-change-btn {
		position: static;
		width: auto;
		height: auto;
		min-height: 44px;
		padding: 6px 14px;
		border-radius: var(--radius-button, 6px);
		font-size: 0.8125rem;
		gap: 6px;
	}

	/* ── Title ──────────────────────────────────────────────────── */

	.simple-title {
		font-family: var(--font-heading, 'DM Sans', sans-serif);
		font-size: clamp(1.75rem, 5vw + 0.5rem, 2.25rem);
		font-weight: var(--heading-weight, 500);
		line-height: 1.15;
		letter-spacing: var(--heading-tracking, -0.025em);
		color: var(--color-fg, var(--foreground));
		margin: 0 0 12px;
	}

	/* ── Accent Line ───────────────────────────────────────────── */

	.simple-accent-line {
		width: 40px;
		height: 2.5px;
		background: var(--primary);
		border-radius: 1px;
		margin-bottom: 16px;
		transform-origin: left center;
	}

	/* ── Info Rows ──────────────────────────────────────────────── */

	.simple-info-row {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 5px 0;
	}

	.simple-info-row :global(.simple-icon) {
		color: color-mix(in oklch, var(--primary) 45%, var(--color-fg, var(--foreground)));
		flex-shrink: 0;
		margin-top: 3px;
	}

	.simple-info-text {
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.875rem;
		line-height: 1.55;
		letter-spacing: -0.01em;
		color: var(--color-fg-secondary, var(--muted-foreground));
	}

	.simple-info-venue {
		display: block;
		font-family: var(--font-body, 'DM Sans', sans-serif);
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: 0;
		color: var(--color-fg, var(--foreground));
	}

	.simple-info-address {
		display: block;
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.75rem;
		line-height: 1.45;
		letter-spacing: -0.01em;
		color: var(--color-fg-secondary, var(--muted-foreground));
	}

	/* ── Edit Mode: Date Inputs ─────────────────────────────────── */

	.layout-date-input {
		background: transparent;
		border: 1px dashed var(--color-border, var(--border, #2e2c2a));
		border-radius: 4px;
		outline: none;
		font: inherit;
		color: inherit;
		padding: 2px 6px;
		margin: -2px -6px;
		transition: all var(--motion-duration-standard, 200ms) var(--motion-ease, ease);
		color-scheme: dark;
	}

	.layout-date-input:hover {
		background: color-mix(in srgb, var(--color-fg, var(--foreground, #ede9e3)) 5%, transparent);
	}

	.layout-date-input:focus {
		border-color: var(--primary);
		background: color-mix(in srgb, var(--color-fg, var(--foreground, #ede9e3)) 3%, transparent);
	}

	.layout-date-input:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* ── Dividers ───────────────────────────────────────────────── */

	.simple-divider {
		height: 1px;
		background: color-mix(in oklch, var(--primary) 15%, var(--color-divider, var(--divider-color, var(--border))));
		border: none;
		margin: 14px 0;
	}

	@media (max-width: 639px) {
		.simple-divider {
			margin-left: 26px;
		}
	}

	/* ── Muted (location hidden) ────────────────────────────────── */

	:global(.simple-icon-muted) {
		color: var(--color-fg-tertiary, var(--muted-foreground)) !important;
		opacity: 0.6;
	}

	.simple-info-muted {
		color: var(--color-fg-tertiary, var(--muted-foreground));
		font-style: italic;
	}

	/* ── Description ────────────────────────────────────────────── */

	:global(.simple-description) {
		font-size: 1rem;
		line-height: var(--body-line-height, 1.55);
		color: var(--color-fg, var(--foreground));
		white-space: pre-wrap;
		margin: 0;
		max-width: 55ch;
	}

	/* ── Guest Count ────────────────────────────────────────────── */

	.simple-guest-count {
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.8125rem;
		line-height: 1.45;
		letter-spacing: -0.01em;
		color: var(--color-fg-secondary, var(--muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	.simple-guest-view-link {
		background: none;
		border: none;
		padding: 0;
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.8125rem;
		color: var(--color-accent, var(--primary));
		cursor: pointer;
		transition: opacity 150ms ease;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.simple-guest-view-link:hover {
		opacity: 0.8;
	}

	.simple-meta-row {
		margin-top: 0;
	}

	/* ── RSVP Section (Inline) ──────────────────────────────────── */

	.simple-rsvp {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 20px;
	}

	.simple-rsvp-secondary {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 24px;
	}

	.simple-btn {
		height: 46px;
		border-radius: var(--radius-button, 6px);
		font-family: var(--font-body, 'DM Sans', sans-serif);
		font-size: 0.875rem;
		font-weight: 500;
		letter-spacing: 0.01em;
		cursor: pointer;
		transition:
			background-color var(--motion-duration-standard, 200ms) var(--motion-ease, ease),
			color var(--motion-duration-standard, 200ms) var(--motion-ease, ease),
			border-color var(--motion-duration-standard, 200ms) var(--motion-ease, ease),
			transform 100ms ease;
		border: none;
	}

	.simple-btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.simple-btn-primary {
		width: 100%;
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.simple-btn-primary:hover {
		background: color-mix(in oklch, var(--primary) 85%, var(--foreground));
	}

	.simple-maybe-link {
		background: transparent;
		border: none;
		color: var(--color-fg-secondary, var(--muted-foreground));
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.8125rem;
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-color: color-mix(in oklch, var(--primary) 30%, var(--border));
		cursor: pointer;
		padding: 8px 4px;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		transition:
			color var(--motion-duration-standard, 200ms) var(--motion-ease, ease),
			text-decoration-color var(--motion-duration-standard, 200ms) var(--motion-ease, ease);
	}

	.simple-maybe-link:hover {
		color: var(--color-fg, var(--foreground));
		text-decoration-color: color-mix(in oklch, var(--primary) 50%, var(--foreground));
	}

	.simple-maybe-link:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.simple-decline-link {
		background: transparent;
		border: none;
		color: var(--color-fg-secondary, var(--muted-foreground));
		opacity: 0.6;
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.75rem;
		font-weight: 400;
		letter-spacing: 0.01em;
		cursor: pointer;
		padding: 8px 4px;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		transition:
			opacity var(--motion-duration-standard, 200ms) var(--motion-ease, ease),
			color var(--motion-duration-standard, 200ms) var(--motion-ease, ease);
	}

	.simple-decline-link:hover {
		opacity: 1;
		color: var(--color-fg, var(--foreground));
	}

	.simple-decline-link:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* ── Host Attribution ───────────────────────────────────────── */

	.simple-host {
		font-family: var(--font-body, 'DM Sans', sans-serif);
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--color-fg-tertiary, var(--muted-foreground));
		margin: 0;
	}

	.simple-host-name {
		color: color-mix(in oklch, var(--primary) 45%, var(--color-fg, var(--foreground)));
	}

	/* ── Branding — pinned to bottom of viewport ────────────────── */

	.simple-branding-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: auto;
		padding-bottom: 3.5dvh;
	}

	.simple-branding {
		display: flex;
		align-items: center;
		gap: 6px;
		text-decoration: none;
		font-size: 0.6875rem;
		color: var(--color-fg-tertiary, var(--muted-foreground));
		opacity: 0.5;
		transition: opacity var(--motion-duration-standard, 200ms) var(--motion-ease, ease);
	}

	.simple-branding:hover {
		opacity: 0.8;
	}

	.simple-branding:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.simple-branding-sep {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--color-fg-tertiary, var(--muted-foreground));
		opacity: 0.3;
	}

	.simple-branding-support {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.6875rem;
		color: var(--color-fg-tertiary, var(--muted-foreground));
		opacity: 0.5;
		cursor: pointer;
		transition: opacity var(--motion-duration-standard, 200ms) var(--motion-ease, ease);
	}

	.simple-branding-support:hover {
		opacity: 0.8;
	}

	.simple-branding-support:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.simple-branding-logo {
		height: 14px;
		opacity: 0.5;
	}

	:global([data-mode='light']) .simple-branding-logo {
		filter: invert(1);
	}

	/* ── Below Fold ─────────────────────────────────────────────── */

	.simple-below-fold {
		max-width: 520px;
		margin: 0 auto;
		padding: 24px 20px 80px;
	}

	@media (min-width: 640px) {
		.simple-below-fold {
			padding: 24px 32px 80px;
		}
	}

	/* ── Action Buttons ─────────────────────────────────────────── */

	.simple-actions {
		display: flex;
		gap: 8px;
	}

	.simple-action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 16px;
		border-radius: var(--radius-button, 6px);
		background: transparent;
		border: 1px solid var(--color-border, var(--border));
		color: var(--color-fg-secondary, var(--muted-foreground));
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		cursor: pointer;
		transition:
			border-color var(--motion-duration-standard, 200ms) var(--motion-ease, ease),
			color var(--motion-duration-standard, 200ms) var(--motion-ease, ease),
			background-color var(--motion-duration-standard, 200ms) var(--motion-ease, ease);
	}

	.simple-action-btn:hover {
		border-color: color-mix(in oklch, var(--primary) 40%, var(--border));
		color: var(--color-fg, var(--foreground));
		background: color-mix(in oklch, var(--primary) 4%, transparent);
	}

	.simple-action-btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.simple-link {
		color: var(--accent, #52b788);
		text-decoration: underline;
		text-underline-offset: 2px;
		font-size: 0.875rem;
		transition: opacity 150ms ease;
		word-break: break-all;
	}

	.simple-link:hover {
		opacity: 0.8;
	}

	.simple-field-col {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}

	.input-error {
		border-color: #e85d04 !important;
	}

	.field-error {
		font-size: 0.6875rem;
		color: #e85d04;
		font-family: 'Manrope Variable', sans-serif;
		font-weight: 500;
		line-height: 1.2;
	}
</style>
