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
		onRsvp,
		onViewGuests,
		onShare,
		onDownloadCalendar,
		onUpdateField,
		onUploadCover,
		ctaSlot
	}: Props = $props();

	const copy = AESTHETIC_COPY.rsvp.warm;
	const hostCopy = AESTHETIC_COPY.host.warm;

	const startDate = $derived(event.start_time ? new Date(event.start_time) : new Date());
	const dateStr = $derived(formatDate(startDate, 'warm'));
	const timeStr = $derived(formatTime(startDate, 'warm'));
	const guestStr = $derived(formatGuestCount(rsvpCounts.going, rsvpCounts.maybe, 'warm'));
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

<article class="warm-layout" data-testid="warm-layout">
	<!-- Linen texture overlay -->
	<div class="warm-grain" aria-hidden="true"></div>

	<!-- Main viewport section: details + branding -->
	<div class="warm-viewport">
		<div class="warm-content">
			<!-- Cover image -->
			{#if coverUrl || event.cover_preview_url || (editMode && onUploadCover)}
				<div class="warm-cover-wrapper" data-animate="cover">
					{#if event.cover_preview_url || coverUrl}
						{#if isVideo}
							<!-- svelte-ignore a11y_media_has_caption -->
							<video
								src={event.cover_preview_url || coverUrl}
								autoplay
								muted
								loop
								playsinline
								class="warm-cover"
							></video>
						{:else}
							<img src={event.cover_preview_url || coverUrl} alt="" class="warm-cover" aria-hidden="true" />
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

			<!-- Host attribution ABOVE title (with inline sprig) -->
			{#if host && hostCopy.visible}
				<p class="warm-host-invitation" data-testid="host-attribution">
					{hostCopy.format(hostName)}
					<span class="warm-sprig-inline" aria-hidden="true">
						<svg width="20" height="16" viewBox="0 0 36 24" fill="none">
							<path d="M18 22 L18 4" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>
							<path d="M18 16 C15 14, 11 13.5, 9 14.5 C11 15.5, 14 15, 18 16Z" fill="currentColor" opacity="0.3"/>
							<path d="M18 10 C15.5 8, 12 8, 10 9 C12 10, 15 9.5, 18 10Z" fill="currentColor" opacity="0.22"/>
							<path d="M18 16 C21 14, 25 13.5, 27 14.5 C25 15.5, 22 15, 18 16Z" fill="currentColor" opacity="0.3"/>
							<path d="M18 10 C20.5 8, 24 8, 26 9 C24 10, 21 9.5, 18 10Z" fill="currentColor" opacity="0.22"/>
							<ellipse cx="18" cy="4" rx="2" ry="2.5" fill="currentColor" opacity="0.2"/>
							<path d="M18 2 C17 3, 16.5 4.5, 18 5.5 C19.5 4.5, 19 3, 18 2Z" fill="currentColor" opacity="0.3"/>
						</svg>
					</span>
				</p>
			{/if}

			<!-- Event title -->
			{#if editMode}
				<InlineTextInput
					value={event.title === 'Untitled Event' ? '' : event.title}
					oninput={(v) => onUpdateField?.('title', v)}
					placeholder="Event name"
					class="warm-title"
					error={fieldErrors.title || ''}
				/>
			{:else}
				<h1 class="warm-title" data-animate="title">{event.title}</h1>
			{/if}

			<!-- Vine divider -->
			<div class="warm-vine" aria-hidden="true">
				<svg class="warm-vine-svg" viewBox="0 0 160 16" fill="none" preserveAspectRatio="xMidYMid meet">
					<path d="M8 8 Q28 5, 48 7 Q58 7.5, 68 8" stroke="currentColor" stroke-width="0.6" opacity="0.35"/>
					<path d="M32 6 Q34 3.5, 37 5 Q35 6.5, 32 6Z" fill="currentColor" opacity="0.25"/>
					<path d="M50 6.5 Q51 4.5, 54 5.5 Q52 7, 50 6.5Z" fill="currentColor" opacity="0.2"/>
					<path d="M76 6 Q78 3.5, 80 6 Q78 5, 76 6Z" fill="currentColor" opacity="0.3"/>
					<path d="M80 6 Q82 3.5, 84 6 Q82 5, 80 6Z" fill="currentColor" opacity="0.3"/>
					<path d="M77 9 Q80 11, 83 9 Q80 10, 77 9Z" fill="currentColor" opacity="0.22"/>
					<circle cx="80" cy="7.5" r="1.2" fill="currentColor" opacity="0.35"/>
					<path d="M92 8 Q102 7.5, 112 7 Q132 5, 152 8" stroke="currentColor" stroke-width="0.6" opacity="0.35"/>
					<path d="M108 5.5 Q110 4.5, 112 6 Q110 6.5, 108 5.5Z" fill="currentColor" opacity="0.2"/>
					<path d="M128 5.5 Q130 3.5, 133 5 Q131 6, 128 5.5Z" fill="currentColor" opacity="0.25"/>
				</svg>
			</div>

			<!-- Info rows -->
			<div class="warm-info-section">
				<div class="warm-info-row" data-animate="info-item">
					<span class="warm-info-icon-wrap"><Calendar size={17} weight="regular" /></span>
					{#if editMode}
						<div class="warm-field-col">
							<input
								type="datetime-local"
								class="layout-date-input warm-info-text"
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
						<span class="warm-info-text">{dateStr}</span>
					{/if}
				</div>

				<hr class="warm-divider" />

				<div class="warm-info-row" data-animate="info-item">
					<span class="warm-info-icon-wrap"><Clock size={17} weight="regular" /></span>
					{#if editMode}
						<div class="warm-field-col">
							<input
								type="datetime-local"
								class="layout-date-input warm-info-text"
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
						<span class="warm-info-text">{timeStr}</span>
					{/if}
				</div>

				{#if editMode || event.venue_name || event.venue_address}
					<hr class="warm-divider" />
					<div class="warm-info-row" data-animate="info-item">
						<span class="warm-info-icon-wrap"><MapPin size={17} weight="regular" /></span>
						<div>
							{#if editMode}
								<InlineTextInput
									value={event.venue_name || ''}
									oninput={(v) => onUpdateField?.('venue_name', v)}
									placeholder="Venue name"
									class="warm-info-text"
								/>
								<InlineTextInput
									value={event.venue_address || ''}
									oninput={(v) => onUpdateField?.('venue_address', v)}
									placeholder="Address"
									class="warm-info-address"
								/>
							{:else}
								<span class="warm-info-text">{event.venue_name}</span>
								{#if event.venue_address}
									<span class="warm-info-address">{event.venue_address}</span>
								{/if}
							{/if}
						</div>
					</div>
				{:else if event.location_hidden}
					<hr class="warm-divider" />
					<div class="warm-info-row" data-animate="info-item">
						<span class="warm-info-icon-wrap warm-icon-muted"><MapPin size={17} weight="regular" /></span>
						<span class="warm-info-text warm-text-muted" data-testid="location-hidden-message">Location revealed after RSVP</span>
					</div>
				{/if}

				<!-- Custom link -->
				{#if editMode}
					<hr class="warm-divider" />
					<div class="warm-info-row" data-animate="info-item">
						<span class="warm-info-icon-wrap"><LinkSimple size={17} weight="regular" /></span>
						<div class="warm-field-col">
							<InlineTextInput
								value={event.link_url || ''}
								oninput={(v) => onUpdateField?.('link_url', v)}
								placeholder="https://..."
								class="warm-info-text"
							/>
							<InlineTextInput
								value={event.link_title || ''}
								oninput={(v) => onUpdateField?.('link_title', v)}
								placeholder="Link text (optional)"
								class="warm-info-address"
							/>
						</div>
					</div>
				{:else if event.link_url}
					<hr class="warm-divider" />
					<div class="warm-info-row" data-animate="info-item">
						<span class="warm-info-icon-wrap"><LinkSimple size={17} weight="regular" /></span>
						<a href={event.link_url} target="_blank" rel="noopener noreferrer" class="warm-link">
							{event.link_title || event.link_url}
						</a>
					</div>
				{/if}
				<!-- Inspo boards -->
				{#if editMode}
					{#each inspoItems as item, i}
						{#if isPinterestBoardEntry(item)}
							<hr class="warm-divider" />
							<div class="warm-info-row" data-animate="info-item">
								<span class="warm-info-icon-wrap"><Palette size={17} weight="regular" /></span>
								<span class="warm-info-text" style="flex:1; opacity:0.8;">📌 {item.name}</span>
								<button
									type="button"
									class="warm-info-icon-wrap"
									style="cursor:pointer; background:none; border:none; padding:2px;"
									onclick={() => removeInspoItem(i)}
									aria-label="Remove Pinterest board"
								>
									<XIcon size={12} weight="bold" />
								</button>
							</div>
						{:else if typeof item === 'string'}
							<hr class="warm-divider" />
							<div class="warm-info-row" data-animate="info-item">
								<span class="warm-info-icon-wrap"><Palette size={17} weight="regular" /></span>
								<div class="warm-field-col" style="flex:1">
									<InlineTextInput
										value={item}
										oninput={(v) => {
											const updated = [...inspoItems];
											updated[i] = v;
											onUpdateField?.('inspo_urls', updated);
										}}
										placeholder="Google Slides URL"
										class="warm-info-text"
									/>
								</div>
								<button
									type="button"
									class="warm-info-icon-wrap"
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
						<hr class="warm-divider" />
						<div class="warm-info-row" data-animate="info-item" style="display:flex; gap:12px;">
							<span class="warm-info-icon-wrap"><Palette size={17} weight="regular" /></span>
							<button
								type="button"
								style="cursor:pointer; background:none; border:none; padding:0; font:inherit;"
								onclick={() => { boardPickerOpen = true; }}
							>
								<span class="warm-info-text" style="color:var(--text-muted)">+ Pinterest board</span>
							</button>
							<span style="color:var(--border-default)">|</span>
							<button
								type="button"
								style="cursor:pointer; background:none; border:none; padding:0; font:inherit;"
								onclick={addInspoUrl}
							>
								<span class="warm-info-text" style="color:var(--text-muted)">+ Google Slides</span>
							</button>
						</div>
					{/if}
				{:else if hasRecognizedInspo}
					<hr class="warm-divider" />
					<div class="warm-info-row" data-animate="info-item">
						<span class="warm-info-icon-wrap"><Palette size={17} weight="regular" /></span>
						<button
							type="button"
							class="warm-link"
							style="cursor:pointer; background:none; border:none; padding:0; font:inherit;"
							onclick={() => { inspoDialogOpen = true; }}
						>
							View Inspo Board
						</button>
					</div>
				{/if}
			</div>

			<!-- Leaf sprig divider -->
			<div class="warm-leaf-divider" aria-hidden="true">
				<svg class="warm-leaf-svg" viewBox="0 0 80 12" fill="none" preserveAspectRatio="xMidYMid meet">
					<path d="M28 6 C32 3, 36 4, 38 6 C36 8, 32 9, 28 6Z" fill="currentColor" opacity="0.25"/>
					<path d="M29 6 L37 6" stroke="currentColor" stroke-width="0.4" opacity="0.2"/>
					<circle cx="40" cy="6" r="1" fill="currentColor" opacity="0.35"/>
					<path d="M52 6 C48 3, 44 4, 42 6 C44 8, 48 9, 52 6Z" fill="currentColor" opacity="0.25"/>
					<path d="M51 6 L43 6" stroke="currentColor" stroke-width="0.4" opacity="0.2"/>
				</svg>
			</div>

			<!-- Description -->
			{#if editMode}
				<EditableDescription
					value={event.description || ''}
					oninput={(v) => onUpdateField?.('description', v)}
					placeholder="Add a description..."
					error={fieldErrors.description || ''}
				/>
			{:else if event.description}
				<ExpandableDescription text={event.description} class="warm-description" />
			{/if}

			<!-- Guest count -->
			<div class="warm-guests">
				<span class="warm-info-icon-wrap"><Users size={17} weight="regular" /></span>
				<span class="warm-guest-count">{guestStr}</span>
				{#if onViewGuests}
					<button class="warm-guest-view-link" onclick={onViewGuests}>View</button>
				{/if}
			</div>

			<!-- RSVP section -->
			{#if showRsvpBar && !editMode}
				<div class="warm-rsvp" data-testid="rsvp-buttons" data-animate="cta">
					<button class="warm-btn warm-btn-primary" use:pressFeedback onclick={() => onRsvp?.('going')}>
						{copy.going}
					</button>

					{#if copy.hasMaybe}
						<button class="warm-maybe-link" use:pressFeedback onclick={() => onRsvp?.('maybe')}>
							{copy.maybe}
						</button>
					{/if}

					<button class="warm-decline-link" use:pressFeedback onclick={() => onRsvp?.('declined')}>
						{copy.decline}
					</button>
				</div>
			{/if}
		</div>

		<!-- Branding — always at very bottom of viewport -->
		<div class="warm-branding-row">
			<a href="/" class="warm-branding">
				<span>powered by</span>
				<img src="/landing/logo-full-white.png" alt="Ephemeral" class="warm-branding-logo" />
			</a>
			<span class="warm-branding-sep" aria-hidden="true"></span>
			<button class="warm-branding-support" onclick={openSupport}>Support</button>
		</div>
	</div>

	<!-- Below fold: action buttons + closing vine -->
	{#if !editMode && (onShare || onDownloadCalendar)}
		<div class="warm-below-fold">
			<div class="warm-actions" use:scrollReveal={{ y: 10 }}>
				{#if onDownloadCalendar}
					<button class="warm-action-btn" use:pressFeedback onclick={onDownloadCalendar}>
						<span class="warm-action-icon"><CalendarPlus size={16} weight="regular" /></span>
						Add to Calendar
					</button>
				{/if}
				{#if onShare}
					<button class="warm-action-btn" use:pressFeedback onclick={onShare}>
						<span class="warm-action-icon"><ShareNetwork size={16} weight="regular" /></span>
						Share
					</button>
				{/if}
			</div>

			<!-- Closing vine flourish -->
			<div class="warm-closing-vine" aria-hidden="true" use:scrollReveal={{ y: 8 }}>
				<svg viewBox="0 0 120 20" fill="none" preserveAspectRatio="xMidYMid meet">
					<path d="M10 10 Q25 7, 40 9 Q48 9.5, 54 10" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>
					<path d="M28 8 Q30 5.5, 33 7.5 Q31 8.5, 28 8Z" fill="currentColor" opacity="0.2"/>
					<path d="M56 8 Q58 5, 60 8 Q58 7, 56 8Z" fill="currentColor" opacity="0.25"/>
					<path d="M60 8 Q62 5, 64 8 Q62 7, 60 8Z" fill="currentColor" opacity="0.25"/>
					<path d="M57 12 Q60 14, 63 12 Q60 13, 57 12Z" fill="currentColor" opacity="0.2"/>
					<circle cx="60" cy="10" r="1" fill="currentColor" opacity="0.3"/>
					<path d="M66 10 Q72 9.5, 80 9 Q95 7, 110 10" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>
					<path d="M87 7.5 Q89 5.5, 92 7 Q90 8, 87 7.5Z" fill="currentColor" opacity="0.2"/>
				</svg>
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
	.warm-layout {
		position: relative;
		background: var(--background);
		color: var(--foreground);
		font-family: var(--font-body, 'Source Sans 3', sans-serif);
		overflow: hidden;
	}

	/* Linen texture overlay — stronger for visibility */
	.warm-grain {
		position: fixed;
		inset: 0;
		z-index: 0;
		background-image: var(--surface-grain, none);
		background-repeat: repeat;
		background-size: 200px 200px;
		opacity: 0.12;
		pointer-events: none;
	}

	/* Viewport-height section: details fill top, branding at bottom */
	.warm-viewport {
		position: relative;
		z-index: 1;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.warm-content {
		width: 100%;
		max-width: 100%;
		margin: 0 auto;
		padding: 22px 36px 0;
	}

	@media (min-width: 640px) {
		.warm-content {
			padding: 28px 56px 0;
			max-width: 640px;
		}
	}

	/* Cover image */
	.warm-cover-wrapper {
		position: relative;
		margin-bottom: 14px;
		border-radius: 6px;
		overflow: hidden;
		min-height: 120px;
	}

	.warm-cover {
		width: 100%;
		max-height: 200px;
		object-fit: cover;
		border-radius: 6px;
		aspect-ratio: 16 / 9;
	}

	.cover-change-btn {
		position: absolute;
		top: 8px;
		right: 8px;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.5);
		color: #ede9e3;
		cursor: pointer;
		transition: background 150ms ease;
		backdrop-filter: blur(8px);
	}

	.cover-change-btn:hover {
		background: rgba(0, 0, 0, 0.7);
	}

	.cover-change-btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.warm-cover-wrapper:not(:has(.warm-cover)) {
		border: 2px dashed var(--border, #2e2c2a);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.warm-cover-wrapper:not(:has(.warm-cover)) .cover-change-btn {
		position: static;
		width: auto;
		height: auto;
		padding: 6px 14px;
		border-radius: 8px;
		font-size: 0.8125rem;
		gap: 6px;
	}

	/* Host attribution ABOVE title */
	.warm-host-invitation {
		font-family: var(--font-body, 'Source Sans 3', sans-serif);
		font-size: 1rem;
		line-height: 1.5;
		color: var(--muted-foreground);
		margin: 0 0 2px;
		letter-spacing: 0.02em;
	}

	/* Botanical sprig — inline next to host text */
	.warm-sprig-inline {
		display: inline-flex;
		vertical-align: middle;
		margin-left: 4px;
		color: color-mix(in oklch, var(--primary) 50%, var(--muted-foreground));
	}

	.warm-title {
		font-family: var(--font-heading, 'Cormorant Garamond', serif);
		font-size: 2.25rem;
		font-weight: var(--heading-weight, 300);
		line-height: 1.2;
		letter-spacing: var(--heading-tracking, 0.01em);
		color: var(--foreground);
		margin: 0 0 6px;
	}

	/* Vine divider */
	.warm-vine {
		display: flex;
		justify-content: center;
		padding: 2px 0;
		color: color-mix(in oklch, var(--primary) 40%, var(--muted-foreground));
	}

	.warm-vine-svg {
		width: 140px;
		height: 14px;
	}

	/* Leaf sprig divider */
	.warm-leaf-divider {
		display: flex;
		justify-content: center;
		padding: 6px 0;
		color: color-mix(in oklch, var(--primary) 35%, var(--muted-foreground));
	}

	.warm-leaf-svg {
		width: 72px;
		height: 12px;
	}

	/* Info section */
	.warm-info-section {
		margin-bottom: 0;
	}

	.warm-info-row {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 6px 0;
	}

	.warm-info-icon-wrap {
		color: color-mix(in oklch, var(--primary) 40%, var(--muted-foreground));
		flex-shrink: 0;
		margin-top: 2px;
		display: flex;
	}

	.warm-info-text {
		font-size: 1rem;
		line-height: 1.5;
		color: var(--foreground);
		letter-spacing: 0.01em;
	}

	.warm-info-address {
		display: block;
		font-size: 0.8125rem;
		line-height: 1.4;
		color: var(--muted-foreground);
		letter-spacing: 0.02em;
	}

	.layout-date-input {
		background: transparent;
		border: 1px dashed var(--border, #2e2c2a);
		border-radius: 4px;
		outline: none;
		font: inherit;
		color: inherit;
		padding: 2px 6px;
		margin: -2px -6px;
		transition: all 150ms ease;
		color-scheme: dark;
	}

	.layout-date-input:hover {
		background: color-mix(in srgb, var(--foreground, #ede9e3) 5%, transparent);
	}

	.layout-date-input:focus {
		border-color: var(--primary, #52b788);
		background: color-mix(in srgb, var(--foreground, #ede9e3) 3%, transparent);
	}

	.layout-date-input:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.warm-divider {
		height: 1px;
		background: var(--border);
		opacity: 0.3;
		border: none;
		margin: 0 28px;
	}

	/* Muted (location hidden) */
	.warm-icon-muted {
		color: var(--muted-foreground) !important;
		opacity: 0.5;
	}

	.warm-text-muted {
		color: var(--muted-foreground);
		font-style: italic;
	}

	/* Description */
	:global(.warm-description) {
		font-size: 1rem;
		line-height: 1.65;
		color: var(--foreground);
		white-space: pre-wrap;
		margin: 0 0 4px;
		letter-spacing: 0.01em;
		max-width: 55ch;
	}

	/* Guest count */
	.warm-guests {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 4px 0;
	}

	.warm-guest-count {
		font-size: 1rem;
		line-height: 1.5;
		color: var(--foreground);
		letter-spacing: 0.01em;
		font-variant-numeric: tabular-nums;
	}

	.warm-guest-view-link {
		background: none;
		border: none;
		padding: 0;
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--primary);
		cursor: pointer;
		transition: opacity 150ms ease;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.warm-guest-view-link:hover {
		opacity: 0.8;
	}

	/* RSVP section */
	.warm-rsvp {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 10px;
		margin-top: 10px;
	}

	.warm-btn {
		height: 46px;
		border-radius: var(--radius-button, 8px);
		font-family: var(--font-body, 'Source Sans 3', sans-serif);
		font-size: 0.9375rem;
		font-weight: 500;
		letter-spacing: 0.03em;
		cursor: pointer;
		transition: all var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.22, 0.1, 0.36, 1));
		padding: 0 28px;
	}

	.warm-btn-primary {
		background: var(--primary);
		color: var(--primary-foreground);
		border: none;
	}

	.warm-btn-primary:hover {
		filter: brightness(1.1);
	}

	.warm-btn-primary:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.warm-maybe-link {
		background: transparent;
		border: none;
		color: var(--muted-foreground);
		font-family: var(--font-body, 'Source Sans 3', sans-serif);
		font-size: 0.9375rem;
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-color: color-mix(in oklch, var(--primary) 30%, var(--border));
		cursor: pointer;
		padding: 6px 0;
		transition: color var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.22, 0.1, 0.36, 1));
	}

	.warm-maybe-link:hover {
		color: var(--foreground);
		text-decoration-color: color-mix(in oklch, var(--primary) 50%, var(--foreground));
	}

	.warm-maybe-link:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.warm-decline-link {
		background: transparent;
		border: none;
		color: var(--muted-foreground);
		opacity: 0.7;
		font-family: var(--font-body, 'Source Sans 3', sans-serif);
		font-size: 0.8125rem;
		font-weight: 400;
		letter-spacing: 0.02em;
		cursor: pointer;
		padding: 6px 0;
		transition: all var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.22, 0.1, 0.36, 1));
	}

	.warm-decline-link:hover {
		opacity: 1;
		color: var(--foreground);
	}

	.warm-decline-link:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* ── Branding — pinned to bottom of viewport ────────────────── */

	.warm-branding-row {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: auto;
		padding-bottom: 3.5dvh;
	}

	.warm-branding {
		display: flex;
		align-items: center;
		gap: 6px;
		text-decoration: none;
		font-size: 0.6875rem;
		color: var(--muted-foreground);
		opacity: 0.5;
		transition: opacity var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.22, 0.1, 0.36, 1));
	}

	.warm-branding:hover {
		opacity: 0.8;
	}

	.warm-branding:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.warm-branding-sep {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--muted-foreground);
		opacity: 0.3;
	}

	.warm-branding-support {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.6875rem;
		color: var(--muted-foreground);
		opacity: 0.5;
		cursor: pointer;
		transition: opacity var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.22, 0.1, 0.36, 1));
	}

	.warm-branding-support:hover {
		opacity: 0.8;
	}

	.warm-branding-support:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.warm-branding-logo {
		height: 14px;
		opacity: 0.5;
	}

	:global([data-mode='light']) .warm-branding-logo {
		filter: invert(1);
	}

	/* ── Below Fold ─────────────────────────────────────────────── */

	.warm-below-fold {
		position: relative;
		z-index: 1;
		max-width: 100%;
		margin: 0 auto;
		padding: 24px 36px 80px;
	}

	@media (min-width: 640px) {
		.warm-below-fold {
			max-width: 640px;
			padding: 24px 56px 80px;
		}
	}

	/* Action buttons */
	.warm-actions {
		display: flex;
		gap: 12px;
	}

	.warm-action-icon {
		color: color-mix(in oklch, var(--primary) 50%, var(--foreground));
		display: flex;
	}

	.warm-action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: var(--radius-button, 8px);
		background: var(--secondary);
		border: 1px solid var(--border);
		color: var(--foreground);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.22, 0.1, 0.36, 1));
	}

	.warm-action-btn:hover {
		background: color-mix(in oklch, var(--primary) 12%, var(--secondary));
		border-color: color-mix(in oklch, var(--primary) 20%, var(--border));
	}

	.warm-action-btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* Closing vine flourish */
	.warm-closing-vine {
		display: flex;
		justify-content: center;
		padding: 32px 0 0;
		color: color-mix(in oklch, var(--primary) 30%, var(--muted-foreground));
	}

	.warm-closing-vine svg {
		width: 100px;
		height: 16px;
	}

	.warm-link {
		color: var(--accent, #52b788);
		text-decoration: underline;
		text-underline-offset: 2px;
		font-size: 0.875rem;
		transition: opacity 150ms ease;
		word-break: break-all;
	}

	.warm-link:hover {
		opacity: 0.8;
	}

	.warm-field-col {
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
