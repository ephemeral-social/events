<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CalendarBlank, MapPin, ShareNetwork, CalendarPlus, Camera, LinkSimple, Palette, X as XIcon } from 'phosphor-svelte';
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

	const copy = AESTHETIC_COPY.rsvp.elegant;
	const hostCopy = AESTHETIC_COPY.host.elegant;

	const startDate = $derived(event.start_time ? new Date(event.start_time) : new Date());
	const dateStr = $derived(formatDate(startDate, 'elegant'));
	const timeStr = $derived(formatTime(startDate, 'elegant'));
	const guestStr = $derived(formatGuestCount(rsvpCounts.going, rsvpCounts.maybe, 'elegant'));
	const coverUrl = $derived(getCoverImageUrl(event.cover_r2_key));
	const isVideo = $derived(event.cover_is_video || isCoverVideo(event.cover_r2_key));
	const hostName = $derived(host?.display_name || 'Someone');
	const uploadStatus = $derived(getCoverUploadStatus());
	const fieldErrors = $derived(getFieldErrors());

	// Inspo board state
	let inspoDialogOpen = $state(false);
	let boardPickerOpen = $state(false);
	let inspoItems = $derived((event.inspo_urls || []) as InspoItem[]);

	// Auto-open board picker when returning from Pinterest OAuth
	$effect(() => {
		if (editMode) {
			const params = new URLSearchParams(window.location.search);
			if (params.has('pinterest_connected') || params.has('pinterest_picker')) {
				boardPickerOpen = true;
			}
		}
	});
	let hasRecognizedInspo = $derived(
		inspoItems.some((item: InspoItem) => getInspoType(item) !== 'unknown')
	);
	let pinterestBoardCount = $derived(inspoItems.filter(isPinterestBoardEntry).length);
	let slidesUrls = $derived(inspoItems.filter((item): item is string => typeof item === 'string'));

	function updateInspoUrl(index: number, value: string) {
		// Find the actual index in inspoItems for string entries
		let stringIndex = -1;
		for (let i = 0; i < inspoItems.length; i++) {
			if (typeof inspoItems[i] === 'string') {
				stringIndex++;
				if (stringIndex === index) {
					const updated = [...inspoItems];
					updated[i] = value;
					onUpdateField?.('inspo_urls', updated);
					return;
				}
			}
		}
	}
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

<article class="elegant-layout" data-testid="elegant-layout">
	<!-- Thin invitation-card border frame -->
	<div class="elegant-frame" aria-hidden="true">
		<div class="elegant-frame-corner elegant-frame-tl"></div>
		<div class="elegant-frame-corner elegant-frame-tr"></div>
		<div class="elegant-frame-corner elegant-frame-bl"></div>
		<div class="elegant-frame-corner elegant-frame-br"></div>
	</div>

	<div class="elegant-content">
		<!-- Masthead: editorial top rule with primary tint -->
		<div class="elegant-masthead-rule" aria-hidden="true"></div>

		<!-- Host attribution at TOP (formal) -->
		{#if host && hostCopy.visible}
			<p class="elegant-host-attribution" data-testid="host-attribution">
				{hostCopy.format(hostName)}
			</p>
		{/if}

		<!-- Ornamental rule with diamond -->
		<div class="elegant-rule-ornament" aria-hidden="true">
			<span class="elegant-rule-line"></span>
			<span class="elegant-rule-diamond"></span>
			<span class="elegant-rule-line"></span>
		</div>

		<!-- Optional subtitle/occasion (unique to Elegant) -->
		{#if editMode}
			<div class="elegant-edit-centered">
				<InlineTextInput
					value={event.subtitle || ''}
					oninput={(v) => onUpdateField?.('subtitle', v)}
					placeholder="Subtitle or occasion"
					class="elegant-subtitle"
				/>
			</div>
		{:else if event.subtitle}
			<p class="elegant-subtitle">{event.subtitle}</p>
		{/if}

		<!-- Event title (centered, uppercase, tracked) -->
		{#if editMode}
			<div class="elegant-edit-centered">
				<InlineTextInput
					value={event.title === 'Untitled Event' ? '' : event.title}
					oninput={(v) => onUpdateField?.('title', v)}
					placeholder="Event name"
					class="elegant-title"
					error={fieldErrors.title || ''}
				/>
			</div>
		{:else}
			<h1 class="elegant-title" data-animate="title">{event.title}</h1>
		{/if}

		<!-- Ornamental rule with dot -->
		<div class="elegant-rule-ornament elegant-rule-ornament-sm" aria-hidden="true">
			<span class="elegant-rule-line"></span>
			<span class="elegant-rule-dot"></span>
			<span class="elegant-rule-line"></span>
		</div>

		<!-- Cover image -->
		{#if coverUrl || event.cover_preview_url || (editMode && onUploadCover)}
			<div class="elegant-cover-frame" data-animate="cover">
				{#if event.cover_preview_url || coverUrl}
					{#if isVideo}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video
							src={event.cover_preview_url || coverUrl}
							autoplay
							muted
							loop
							playsinline
							class="elegant-cover-img"
						></video>
					{:else}
						<img src={event.cover_preview_url || coverUrl} alt="" class="elegant-cover-img" aria-hidden="true" />
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

		<!-- Date/time + venue with primary accent border -->
		<div class="elegant-info-section" use:scrollReveal={{ y: 10 }}>
			<div class="elegant-datetime" data-animate="info-item">
				{#if editMode}
					<div class="elegant-field-col">
						<input
							type="datetime-local"
							class="layout-date-input elegant-date"
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
					<div class="elegant-field-col">
						<input
							type="datetime-local"
							class="layout-date-input elegant-time"
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
					<p class="elegant-date">{dateStr}</p>
					<p class="elegant-time">{timeStr}</p>
				{/if}
			</div>

			{#if editMode || event.venue_name || event.venue_address}
				<div class="elegant-info-divider" aria-hidden="true"></div>
				<div class="elegant-venue" data-animate="info-item">
					{#if editMode}
						<div class="elegant-edit-centered">
							<InlineTextInput
								value={event.venue_name || ''}
								oninput={(v) => onUpdateField?.('venue_name', v)}
								placeholder="Venue name"
								class="elegant-venue-name"
							/>
						</div>
						<div class="elegant-edit-centered">
							<InlineTextInput
								value={event.venue_address || ''}
								oninput={(v) => onUpdateField?.('venue_address', v)}
								placeholder="Address"
								class="elegant-venue-address"
							/>
						</div>
					{:else}
						<p class="elegant-venue-name">{event.venue_name}</p>
						{#if event.venue_address}
							<p class="elegant-venue-address">{event.venue_address}</p>
						{/if}
					{/if}
				</div>
			{:else if event.location_hidden}
				<div class="elegant-info-divider" aria-hidden="true"></div>
				<div class="elegant-venue" data-animate="info-item">
					<p class="elegant-venue-address" data-testid="location-hidden-message">Location revealed after RSVP</p>
				</div>
			{/if}

			<!-- Custom link -->
			{#if editMode}
				<div class="elegant-info-divider" aria-hidden="true"></div>
				<div class="elegant-venue" data-animate="info-item">
					<div class="elegant-edit-centered">
						<InlineTextInput
							value={event.link_url || ''}
							oninput={(v) => onUpdateField?.('link_url', v)}
							placeholder="https://..."
							class="elegant-venue-name"
						/>
					</div>
					<div class="elegant-edit-centered">
						<InlineTextInput
							value={event.link_title || ''}
							oninput={(v) => onUpdateField?.('link_title', v)}
							placeholder="Link text (optional)"
							class="elegant-venue-address"
						/>
					</div>
				</div>
			{:else if event.link_url}
				<div class="elegant-info-divider" aria-hidden="true"></div>
				<div class="elegant-venue" data-animate="info-item">
					<a href={event.link_url} target="_blank" rel="noopener noreferrer" class="elegant-link">
						{event.link_title || event.link_url}
					</a>
				</div>
			{/if}
			<!-- Inspo boards -->
			{#if editMode}
				<!-- Pinterest boards (structured entries) -->
				{#each inspoItems as item, i}
					{#if isPinterestBoardEntry(item)}
						<div class="elegant-info-divider" aria-hidden="true"></div>
						<div class="elegant-venue" data-animate="info-item">
							<div class="elegant-edit-centered" style="display:flex; gap:8px; align-items:center; width:100%;">
								<span class="elegant-venue-name" style="flex:1; opacity:0.8;">📌 {item.name}</span>
								<button
									type="button"
									style="cursor:pointer; background:none; border:none; padding:2px; color:var(--text-muted);"
									onclick={() => removeInspoItem(i)}
									aria-label="Remove Pinterest board"
								>
									<XIcon size={12} weight="bold" />
								</button>
							</div>
						</div>
					{:else if typeof item === 'string'}
						<div class="elegant-info-divider" aria-hidden="true"></div>
						<div class="elegant-venue" data-animate="info-item">
							<div class="elegant-edit-centered" style="display:flex; gap:8px; align-items:center; width:100%;">
								<InlineTextInput
									value={item}
									oninput={(v) => {
										const updated = [...inspoItems];
										updated[i] = v;
										onUpdateField?.('inspo_urls', updated);
									}}
									placeholder="Google Slides URL"
									class="elegant-venue-name"
								/>
								<button
									type="button"
									style="cursor:pointer; background:none; border:none; padding:2px; color:var(--text-muted);"
									onclick={() => removeInspoItem(i)}
									aria-label="Remove inspo URL"
								>
									<XIcon size={12} weight="bold" />
								</button>
							</div>
						</div>
					{/if}
				{/each}
				{#if inspoItems.length < 3}
					<div class="elegant-info-divider" aria-hidden="true"></div>
					<div class="elegant-venue" data-animate="info-item" style="display:flex; gap:8px; justify-content:center;">
						<button
							type="button"
							style="cursor:pointer; background:none; border:none; padding:0; font:inherit;"
							onclick={() => { boardPickerOpen = true; }}
						>
							<span class="elegant-venue-address" style="color:var(--text-muted)">+ Pinterest board</span>
						</button>
						<span class="elegant-venue-address" style="color:var(--border-default)">|</span>
						<button
							type="button"
							style="cursor:pointer; background:none; border:none; padding:0; font:inherit;"
							onclick={addInspoUrl}
						>
							<span class="elegant-venue-address" style="color:var(--text-muted)">+ Google Slides</span>
						</button>
					</div>
				{/if}
			{:else if hasRecognizedInspo}
				<div class="elegant-info-divider" aria-hidden="true"></div>
				<div class="elegant-venue" data-animate="info-item">
					<button
						type="button"
						class="elegant-link"
						style="cursor:pointer; background:none; border:none; padding:0; font:inherit;"
						onclick={() => { inspoDialogOpen = true; }}
					>
						View Inspo Board
					</button>
				</div>
			{/if}
		</div>

		<!-- Primary-tinted editorial rule -->
		<div class="elegant-rule elegant-rule-primary" aria-hidden="true"></div>

		<!-- Description -->
		{#if editMode}
			<div class="elegant-edit-centered">
				<EditableDescription
					value={event.description || ''}
					oninput={(v) => onUpdateField?.('description', v)}
					placeholder="Add a description..."
					error={fieldErrors.description || ''}
				/>
			</div>
			<div class="elegant-rule" aria-hidden="true"></div>
		{:else if event.description}
			<div use:scrollReveal={{ y: 10 }}>
				<ExpandableDescription text={event.description} class="elegant-description" />
			</div>
			<div class="elegant-rule" aria-hidden="true"></div>
		{/if}

		<!-- RSVP buttons (stacked vertically, centered) -- NO MAYBE -->
		{#if showRsvpBar && !editMode}
			<div class="elegant-rsvp" data-testid="rsvp-buttons" data-animate="cta">
				<button class="elegant-btn elegant-btn-primary" use:pressFeedback onclick={() => onRsvp?.('going')}>
					{copy.going}
				</button>
				<button class="elegant-decline-link" use:pressFeedback onclick={() => onRsvp?.('declined')}>
					{copy.decline}
				</button>
			</div>
		{/if}

		<!-- Guest count (formal words, uppercase tracked label) -->
		<div class="elegant-guest-row" use:scrollReveal={{ y: 10 }}>
			<p class="elegant-guest-count">{guestStr}</p>
			{#if onViewGuests}
				<button class="elegant-guest-view-link" onclick={onViewGuests}>View Guests</button>
			{/if}
		</div>

		<!-- Ornamental rule -->
		<div class="elegant-rule" aria-hidden="true"></div>

		<!-- Action buttons -->
		{#if onShare || onDownloadCalendar}
			<div class="elegant-actions" use:scrollReveal={{ y: 10 }}>
				{#if onDownloadCalendar}
					<button class="elegant-action-btn" use:pressFeedback onclick={onDownloadCalendar}>
						Save to Calendar
					</button>
				{/if}
				{#if onShare}
					<button class="elegant-action-btn" use:pressFeedback onclick={onShare}>
						Share This Invitation
					</button>
				{/if}
			</div>
		{/if}

		<!-- Closing ornament: diamond between lines -->
		<div class="elegant-closing-ornament" aria-hidden="true" use:scrollReveal={{ y: 8 }}>
			<span class="elegant-rule-line"></span>
			<span class="elegant-rule-diamond"></span>
			<span class="elegant-rule-line"></span>
		</div>

		<!-- Branding -->
		<div class="elegant-branding-row">
			<a href="/" class="elegant-branding">
				<span>powered by</span>
				<img src="/landing/logo-full-white.png" alt="Ephemeral" class="elegant-branding-logo" />
			</a>
			<span class="elegant-branding-sep" aria-hidden="true"></span>
			<button class="elegant-branding-support" onclick={openSupport}>Support</button>
		</div>
	</div>

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
	/* =====================================================================
	   ELEGANT LAYOUT -- Editorial luxury, bespoke invitation
	   Cormorant Garamond (heading) + Raleway (body)
	   Signature: generous whitespace, fine rules, primary-tinted accents,
	   ghost/outlined CTA, silky transitions, geometric ornaments
	   ===================================================================== */

	.elegant-layout {
		position: relative;
		min-height: 100dvh;
		background: var(--background);
		color: var(--foreground);
		font-family: var(--font-body, 'Raleway', sans-serif);
		text-align: center;
		overflow: hidden;
	}

	/* -- Invitation-card border frame -------------------------------- */
	.elegant-frame {
		position: absolute;
		inset: 20px;
		z-index: 0;
		border: 1px solid color-mix(in oklch, var(--primary) 12%, transparent);
		border-radius: 2px;
		pointer-events: none;
	}

	/* Corner ornaments -- small L-shaped brackets */
	.elegant-frame-corner {
		position: absolute;
		width: 14px;
		height: 14px;
		pointer-events: none;
	}

	.elegant-frame-tl {
		top: -1px;
		left: -1px;
		border-top: 1.5px solid color-mix(in oklch, var(--primary) 22%, transparent);
		border-left: 1.5px solid color-mix(in oklch, var(--primary) 22%, transparent);
	}

	.elegant-frame-tr {
		top: -1px;
		right: -1px;
		border-top: 1.5px solid color-mix(in oklch, var(--primary) 22%, transparent);
		border-right: 1.5px solid color-mix(in oklch, var(--primary) 22%, transparent);
	}

	.elegant-frame-bl {
		bottom: -1px;
		left: -1px;
		border-bottom: 1.5px solid color-mix(in oklch, var(--primary) 22%, transparent);
		border-left: 1.5px solid color-mix(in oklch, var(--primary) 22%, transparent);
	}

	.elegant-frame-br {
		bottom: -1px;
		right: -1px;
		border-bottom: 1.5px solid color-mix(in oklch, var(--primary) 22%, transparent);
		border-right: 1.5px solid color-mix(in oklch, var(--primary) 22%, transparent);
	}

	.elegant-content {
		position: relative;
		z-index: 1;
		max-width: 560px;
		margin: 0 auto;
		padding: 56px 36px 160px;
	}

	@media (min-width: 640px) {
		.elegant-content {
			padding: 80px 64px 160px;
		}
	}

	/* Centered edit fields for elegant */
	.elegant-edit-centered {
		text-align: center;
	}

	.elegant-edit-centered :global(.inline-text-input),
	.elegant-edit-centered :global(.editable-description) {
		text-align: center;
	}

	/* -- Masthead rule -- primary-tinted editorial top accent ----------- */
	.elegant-masthead-rule {
		width: 48px;
		height: 1.5px;
		background: color-mix(in oklch, var(--primary) 50%, var(--border));
		margin: 0 auto 40px;
		border-radius: 1px;
	}

	@media (min-width: 640px) {
		.elegant-masthead-rule {
			margin-bottom: 48px;
		}
	}

	/* -- Host attribution -------------------------------------------- */
	.elegant-host-attribution {
		font-family: var(--font-heading, 'Cormorant Garamond', serif);
		font-size: 1rem;
		font-weight: 300;
		font-style: italic;
		line-height: 1.5;
		letter-spacing: 0.02em;
		color: var(--muted-foreground);
		margin: 0 0 28px;
		text-align: center;
	}

	@media (min-width: 640px) {
		.elegant-host-attribution {
			font-size: 1.125rem;
			margin-bottom: 32px;
		}
	}

	/* -- Ornamental rules with geometric shapes ---------------------- */
	.elegant-rule-ornament {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		width: 55%;
		max-width: 240px;
		margin: 20px auto 28px;
	}

	.elegant-rule-ornament-sm {
		width: 45%;
		max-width: 200px;
		margin: 18px auto 24px;
	}

	@media (min-width: 640px) {
		.elegant-rule-ornament {
			margin: 24px auto 32px;
		}

		.elegant-rule-ornament-sm {
			margin: 22px auto 28px;
		}
	}

	.elegant-rule-line {
		flex: 1;
		height: 1px;
		background: color-mix(in oklch, var(--primary) 20%, var(--border));
		opacity: 0.7;
	}

	.elegant-rule-diamond {
		width: 5px;
		height: 5px;
		background: color-mix(in oklch, var(--primary) 35%, var(--border));
		transform: rotate(45deg);
		flex-shrink: 0;
	}

	.elegant-rule-dot {
		width: 4px;
		height: 4px;
		background: color-mix(in oklch, var(--primary) 35%, var(--border));
		border-radius: 50%;
		flex-shrink: 0;
	}

	/* Standard horizontal rule -- primary-tinted */
	.elegant-rule {
		width: 45%;
		max-width: 200px;
		height: 1px;
		background: var(--border);
		opacity: 0.5;
		border: none;
		margin: 32px auto;
	}

	/* Emphasized primary-tinted rule */
	.elegant-rule-primary {
		background: color-mix(in oklch, var(--primary) 25%, var(--border));
		opacity: 0.7;
	}

	@media (min-width: 640px) {
		.elegant-rule {
			margin: 40px auto;
		}
	}

	/* -- Subtitle (unique to Elegant) -------------------------------- */
	.elegant-subtitle {
		font-family: var(--font-heading, 'Cormorant Garamond', serif);
		font-size: 1.25rem;
		font-weight: 300;
		font-style: italic;
		line-height: 1.4;
		letter-spacing: 0.04em;
		color: var(--muted-foreground);
		margin: 0 0 16px;
		text-align: center;
	}

	@media (min-width: 640px) {
		.elegant-subtitle {
			font-size: 1.5rem;
		}
	}

	/* -- Title ------------------------------------------------------- */
	.elegant-title {
		font-family: var(--font-heading, 'Cormorant Garamond', serif);
		font-size: 2.5rem;
		font-weight: var(--heading-weight, 300);
		line-height: 1.15;
		letter-spacing: var(--heading-tracking, 0.08em);
		text-transform: var(--heading-transform, uppercase);
		color: var(--foreground);
		margin: 0;
		text-align: center;
	}

	@media (min-width: 640px) {
		.elegant-title {
			font-size: 3.25rem;
		}
	}

	/* -- Cover image (framed with primary tint) ---------------------- */
	.elegant-cover-frame {
		position: relative;
		width: calc(100% - 16px);
		max-width: 480px;
		margin: 36px auto 44px;
		padding: 6px;
		border: 1px solid color-mix(in oklch, var(--primary) 18%, var(--border));
		border-radius: var(--radius-card, 6px);
		background: var(--card);
		min-height: 80px;
	}

	@media (min-width: 640px) {
		.elegant-cover-frame {
			margin: 44px auto 52px;
		}
	}

	.elegant-cover-img {
		width: 100%;
		height: auto;
		display: block;
		border-radius: 2px;
	}

	.cover-change-btn {
		position: absolute;
		top: 8px;
		right: 8px;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--background) 70%, transparent);
		color: var(--foreground);
		cursor: pointer;
		transition: background var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.25, 0, 0.15, 1));
		backdrop-filter: blur(8px);
	}

	.cover-change-btn:hover {
		background: color-mix(in srgb, var(--background) 85%, transparent);
	}

	.cover-change-btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.elegant-cover-frame:not(:has(.elegant-cover-img)) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.elegant-cover-frame:not(:has(.elegant-cover-img)) .cover-change-btn {
		position: static;
		width: auto;
		height: auto;
		padding: 6px 14px;
		border-radius: 8px;
		font-size: 0.8125rem;
		gap: 6px;
	}

	.layout-date-input {
		background: transparent;
		border: 1px dashed var(--border);
		border-radius: 4px;
		outline: none;
		font: inherit;
		color: inherit;
		padding: 2px 6px;
		transition: all var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.25, 0, 0.15, 1));
		color-scheme: dark;
		text-align: center;
	}

	.layout-date-input:hover {
		background: color-mix(in srgb, var(--foreground) 5%, transparent);
	}

	.layout-date-input:focus {
		border-color: var(--primary);
		background: color-mix(in srgb, var(--foreground) 3%, transparent);
	}

	.layout-date-input:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* -- Info section -- date, time, venue with accent left border ---- */
	.elegant-info-section {
		margin: 0 0 8px;
		padding-left: 16px;
		border-left: 1px solid color-mix(in oklch, var(--primary) 20%, transparent);
		text-align: left;
	}

	@media (min-width: 640px) {
		.elegant-info-section {
			padding-left: 20px;
		}
	}

	/* Re-center within the left-bordered section */
	.elegant-info-section .elegant-date,
	.elegant-info-section .elegant-time,
	.elegant-info-section .elegant-venue-name,
	.elegant-info-section .elegant-venue-address,
	.elegant-info-section .elegant-edit-centered {
		text-align: center;
	}

	.elegant-info-divider {
		width: 20px;
		height: 1px;
		background: color-mix(in oklch, var(--primary) 20%, var(--border));
		margin: 14px auto;
	}

	/* -- Date/Time (formal) ------------------------------------------ */
	.elegant-datetime {
		margin: 0 0 8px;
	}

	.elegant-date {
		font-family: var(--font-heading, 'Cormorant Garamond', serif);
		font-size: 1.125rem;
		font-weight: 400;
		line-height: 1.4;
		letter-spacing: 0.06em;
		color: var(--foreground);
		margin: 0 0 4px;
		text-align: center;
	}

	@media (min-width: 640px) {
		.elegant-date {
			font-size: 1.25rem;
		}
	}

	.elegant-time {
		font-family: var(--font-heading, 'Cormorant Garamond', serif);
		font-size: 1.125rem;
		font-weight: 400;
		line-height: 1.4;
		letter-spacing: 0.06em;
		color: var(--muted-foreground);
		margin: 0;
		text-align: center;
	}

	/* -- Venue ------------------------------------------------------- */
	.elegant-venue {
		margin: 0;
	}

	.elegant-venue-name {
		font-family: var(--font-body, 'Raleway', sans-serif);
		font-size: 1rem;
		font-weight: 400;
		line-height: 1.7;
		letter-spacing: 0.01em;
		color: var(--foreground);
		margin: 0;
		text-align: center;
	}

	.elegant-venue-address {
		font-family: var(--font-body, 'Raleway', sans-serif);
		font-size: 0.8125rem;
		font-weight: 300;
		line-height: 1.5;
		letter-spacing: 0.03em;
		color: var(--muted-foreground);
		margin: 4px 0 0;
		text-align: center;
	}

	/* -- Description ------------------------------------------------- */
	:global(.elegant-description) {
		font-family: var(--font-body, 'Raleway', sans-serif);
		font-size: 1rem;
		font-weight: 400;
		line-height: var(--body-line-height, 1.7);
		letter-spacing: 0.01em;
		color: var(--foreground);
		white-space: pre-wrap;
		margin: 0;
		text-align: center;
		max-width: 50ch;
		margin-left: auto;
		margin-right: auto;
	}

	/* -- RSVP buttons (stacked, ghost/outline primary, ghost decline) - */
	.elegant-rsvp {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		margin: 40px 0;
	}

	@media (min-width: 640px) {
		.elegant-rsvp {
			margin: 48px 0;
		}
	}

	.elegant-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 48px;
		min-width: 240px;
		padding: 0 36px;
		font-family: var(--font-body, 'Raleway', sans-serif);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		border-radius: var(--radius-button, 3px);
		cursor: pointer;
		transition: all var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.25, 0, 0.15, 1));
	}

	.elegant-btn:active {
		transform: scale(0.98);
	}

	/* Ghost/outlined primary -- Elegant's signature restraint */
	.elegant-btn-primary {
		background: transparent;
		color: var(--primary);
		border: 1px solid var(--primary);
	}

	.elegant-btn-primary:hover {
		background: color-mix(in oklch, var(--primary) 12%, transparent);
		color: var(--foreground);
		border-color: color-mix(in oklch, var(--primary) 70%, var(--foreground));
	}

	.elegant-btn-primary:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* Decline -- demoted to ghost text */
	.elegant-decline-link {
		background: transparent;
		border: none;
		color: var(--muted-foreground);
		opacity: 0.6;
		font-family: var(--font-body, 'Raleway', sans-serif);
		font-size: 0.6875rem;
		font-weight: 400;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		cursor: pointer;
		padding: 8px 16px;
		transition: all var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.25, 0, 0.15, 1));
	}

	.elegant-decline-link:hover {
		opacity: 1;
		color: var(--foreground);
	}

	.elegant-decline-link:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* -- Guest count (uppercase tracked label, tabular nums) --------- */
	.elegant-guest-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		margin: 16px 0 0;
	}

	.elegant-guest-count {
		font-family: var(--font-body, 'Raleway', sans-serif);
		font-size: 0.6875rem;
		font-weight: 400;
		line-height: 1.5;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-foreground);
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.elegant-guest-view-link {
		background: none;
		border: none;
		padding: 0;
		font-family: var(--font-body, 'Raleway', sans-serif);
		font-size: 0.6875rem;
		font-weight: 400;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--primary);
		cursor: pointer;
		transition: opacity 150ms ease;
	}

	.elegant-guest-view-link:hover {
		opacity: 0.8;
	}

	/* -- Action buttons ---------------------------------------------- */
	.elegant-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.elegant-action-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 44px;
		min-width: 200px;
		padding: 0 28px;
		font-family: var(--font-body, 'Raleway', sans-serif);
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		background: transparent;
		color: var(--muted-foreground);
		border: 1px solid var(--border);
		border-radius: var(--radius-button, 3px);
		cursor: pointer;
		transition: all var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.25, 0, 0.15, 1));
	}

	.elegant-action-btn:hover {
		color: var(--foreground);
		border-color: color-mix(in oklch, var(--primary) 25%, var(--muted-foreground));
	}

	.elegant-action-btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* -- Closing ornament -------------------------------------------- */
	.elegant-closing-ornament {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		width: 40%;
		max-width: 180px;
		margin: 32px auto 0;
	}

	/* -- Branding ---------------------------------------------------- */
	.elegant-branding-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 52px;
	}

	.elegant-branding {
		display: flex;
		align-items: center;
		gap: 6px;
		text-decoration: none;
		font-family: var(--font-body, 'Raleway', sans-serif);
		font-size: 0.625rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-foreground);
		opacity: 0.35;
		transition: opacity var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.25, 0, 0.15, 1));
	}

	.elegant-branding:hover {
		opacity: 0.65;
	}

	.elegant-branding:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
		opacity: 0.65;
	}

	.elegant-branding-sep {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--muted-foreground);
		opacity: 0.2;
	}

	.elegant-branding-support {
		background: none;
		border: none;
		padding: 0;
		font-family: var(--font-body, 'Raleway', sans-serif);
		font-size: 0.625rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-foreground);
		opacity: 0.35;
		cursor: pointer;
		transition: opacity var(--motion-duration-standard, 400ms) var(--motion-ease, cubic-bezier(0.25, 0, 0.15, 1));
	}

	.elegant-branding-support:hover {
		opacity: 0.65;
	}

	.elegant-branding-support:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.elegant-branding-logo {
		height: 13px;
		opacity: 0.5;
	}

	:global([data-mode='light']) .elegant-branding-logo {
		filter: invert(1);
	}

	.elegant-link {
		color: var(--accent, #52b788);
		text-decoration: underline;
		text-underline-offset: 3px;
		font-size: 0.875rem;
		letter-spacing: 0.02em;
		transition: opacity 150ms ease;
		word-break: break-all;
		text-align: center;
		display: block;
	}

	.elegant-link:hover {
		opacity: 0.8;
	}

	.elegant-field-col {
		display: flex;
		flex-direction: column;
		gap: 2px;
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
		text-align: center;
	}
</style>
