<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import {
		getCoverImageUrl,
		isCoverVideo,
		isTicketedEvent,
		formatPrice,
		type PublicEvent,
		type EventHost,
		type RsvpCounts
	} from '$lib/utils/event-helpers';
	import { formatEventDate, formatTimeRange } from '$lib/utils/date-format';
	import { CalendarBlank, MapPin, Users, Ticket, Camera, LinkSimple, Palette, X as XIcon } from 'phosphor-svelte';
	import type { Snippet } from 'svelte';
	import GenerativeCover from './GenerativeCover.svelte';
	import NumberTicker from '$lib/motion/components/NumberTicker.svelte';
	import { sharedElement } from '$lib/motion/actions/shared-element';
	import { motionOk } from '$lib/motion/utils/reduced-motion.svelte';
	import { onMount } from 'svelte';
	import InlineTextInput from '$lib/components/editor/InlineTextInput.svelte';
	import EditableDescription from '$lib/components/editor/EditableDescription.svelte';
	import ExpandableDescription from '$lib/components/event/ExpandableDescription.svelte';
	import CoverUploadIndicator from '$lib/components/editor/CoverUploadIndicator.svelte';
	import { getCoverUploadStatus, getFieldErrors } from '$lib/stores/event-draft.svelte';
	import { toLocalDatetime } from '$lib/utils/datetime';
	import InspoDialog from '$lib/components/event/InspoDialog.svelte';
	import PinterestBoardPicker from '$lib/components/event/PinterestBoardPicker.svelte';
	import { getInspoType, isPinterestBoardEntry, type InspoItem, type PinterestBoardEntry } from '$lib/utils/inspo';
	import { openTawkChat } from '$lib/utils/tawk';

	interface Props {
		coverKey?: string;
		title: string;
		host: EventHost | null;
		event: PublicEvent;
		rsvpCounts: RsvpCounts;
		showGuestListLink?: boolean;
		onViewGuestList?: () => void;
		cta?: Snippet;
		class?: string;
		editMode?: boolean;
		onUpdateField?: (field: string, value: any) => void;
		onUploadCover?: (file: File) => void;
		coverPreviewUrl?: string | null;
		coverIsVideo?: boolean;
	}

	let { coverKey, title, host, event, rsvpCounts, showGuestListLink = false, onViewGuestList, cta, class: className, editMode = false, onUpdateField, onUploadCover, coverPreviewUrl, coverIsVideo = false }: Props = $props();

	const imageUrl = $derived(coverPreviewUrl || getCoverImageUrl(coverKey));
	const isVideo = $derived(coverIsVideo || isCoverVideo(coverKey));

	const hostName = $derived(host?.display_name || host?.username || 'Someone');

	// Full date + time for the info card
	const dateStr = $derived(formatEventDate(event.start_time, event.timezone));
	const timeStr = $derived(formatTimeRange(event.start_time, event.end_time, event.timezone));
	const venueName = $derived(event.venue_name || null);
	const venueAddress = $derived(event.venue_address || null);

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

	const uploadStatus = $derived(getCoverUploadStatus());
	const fieldErrors = $derived(getFieldErrors());

	let sectionEl: HTMLElement | undefined = $state();
	let coverEl: HTMLDivElement | undefined = $state();

	onMount(() => {
		if (!sectionEl || !coverEl) return;

		let mounted = true;
		let parallax: { stop: () => void } | undefined;
		let blurAnim: { stop: () => void } | undefined;

		(async () => {
			const { animate, scroll } = await import('motion');
			if (!mounted) return;

			const scroller = document.getElementById('scroll-root') || undefined;

			// Match GSAP's start:'top top', end:'bottom top'
			const scrollOffset: any = ['start start', 'end start'];

			// Parallax: cover moves slower than scroll
			parallax = animate(coverEl!, { y: ['0%', '-20%'] }, { ease: 'linear' });
			scroll(parallax as any, { target: sectionEl!, container: scroller, offset: scrollOffset });

			// Progressive blur on scroll (only when motion is OK)
			if (motionOk()) {
				blurAnim = animate(coverEl!, { filter: ['blur(0px)', 'blur(8px)'] }, { ease: 'linear' });
				scroll(blurAnim as any, { target: sectionEl!, container: scroller, offset: scrollOffset });
			}
		})();

		return () => {
			mounted = false;
			parallax?.stop();
			blurAnim?.stop();
		};
	});
</script>

<section
	bind:this={sectionEl}
	class={cn('relative w-full overflow-hidden', className)}
	style="min-height: 100dvh;"
	aria-label="Event cover"
	use:sharedElement={{ name: 'event-' + event.event_id }}
>
	<!-- Cover media — parallax layer (Motion scroll() moves this slower than scroll) -->
	<div
		bind:this={coverEl}
		class="parallax-cover"
		data-animate="cover"
	>
		{#if isVideo && imageUrl}
			<video
				src={imageUrl}
				autoplay
				muted
				loop
				playsinline
				class="h-full w-full object-cover pointer-events-none"
			></video>
		{:else if imageUrl}
			<img
				src={imageUrl}
				alt=""
				class="h-full w-full object-cover"
				loading="eager"
				aria-hidden="true"
			/>
		{:else}
			<GenerativeCover seed={title} />
		{/if}
	</div>

	<!-- Cover change button (edit mode) — top-right, does NOT block page interaction -->
	{#if editMode && onUploadCover}
		<label class="hero-cover-change-btn" aria-label="Change cover image">
			<input type="file" accept="image/*,video/*" class="sr-only" onchange={handleCoverFileSelect} />
			<Camera size={16} weight="regular" />
		</label>
	{/if}

	{#if editMode}
		<div class="hero-upload-overlay-wrapper">
			<CoverUploadIndicator status={uploadStatus} />
		</div>
	{/if}

	<!-- Gradient scrim -->
	<div
		class="absolute inset-0 scrim-gradient"
		aria-hidden="true"
	></div>

	<!-- Content overlay -->
	<div
		class="hero-content-overlay relative w-full flex flex-col items-center justify-between px-4"
		style="padding-bottom: max(28px, calc(var(--safe-bottom) + 20px)); padding-top: 25dvh;"
	>
		<!-- Event info — top group -->
		<div class="w-full max-w-lg space-y-3">
			<!-- Title -->
			{#if editMode && onUpdateField}
				<div class="text-display-md text-[var(--text-primary)] hero-text-shadow" data-animate="title">
					<InlineTextInput
						value={title === 'Untitled Event' ? '' : title}
						oninput={(v) => onUpdateField('title', v)}
						placeholder="Event name"
						error={fieldErrors.title || ''}
					/>
				</div>
			{:else}
				<h1
					class="text-display-md text-[var(--text-primary)] hero-text-shadow"
					data-animate="title"
				>
					{title}
				</h1>
			{/if}

			<!-- Host -->
			{#if host}
				<p
					class="text-body-sm text-[var(--text-secondary)] hero-text-shadow-sm"
				>
					Hosted by
					<span class="font-medium text-[var(--text-primary)]">{hostName}</span>
				</p>
			{/if}

			<!-- Description -->
			{#if editMode && onUpdateField}
				<div class="min-h-14 border-b border-[var(--text-primary)]/5 pb-3 text-body-md leading-relaxed text-[var(--text-primary)] hero-text-shadow-subtle">
					<EditableDescription
						value={event.description || ''}
						oninput={(v) => onUpdateField('description', v)}
						placeholder="Add a description..."
						error={fieldErrors.description || ''}
					/>
				</div>
			{:else if event.description}
				<div class="min-h-14 border-b border-[var(--text-primary)]/5 pb-3 text-body-md leading-relaxed text-[var(--text-primary)] hero-text-shadow-subtle">
					<ExpandableDescription text={event.description} maxLines={3} />
				</div>
			{/if}

			<!-- Info rows — uniform height -->
			<div class="grid gap-2">
				<!-- Date + Time -->
				<div class="flex items-center gap-3 min-h-8" data-animate="info-item">
					<CalendarBlank
						size={18}
						weight="regular"
						class="text-[var(--accent-primary)] shrink-0"
					/>
					<div>
						{#if editMode && onUpdateField}
							<div class="hero-field-col">
								<input
									type="datetime-local"
									class="hero-date-input text-body-sm font-medium text-[var(--text-primary)] hero-text-shadow-sm"
									class:input-error={fieldErrors.start_time}
									value={toLocalDatetime(event.start_time)}
									onchange={(e) => {
										const v = e.currentTarget.value;
										onUpdateField('start_time', v ? new Date(v).toISOString() : null);
									}}
								/>
								{#if fieldErrors.start_time}
									<span class="field-error">{fieldErrors.start_time}</span>
								{/if}
							</div>
							<div class="hero-field-col">
								<input
									type="datetime-local"
									class="hero-date-input text-caption text-[var(--text-secondary)] hero-text-shadow-sm"
									class:input-error={fieldErrors.end_time}
									value={toLocalDatetime(event.end_time)}
									onchange={(e) => {
										const v = e.currentTarget.value;
										onUpdateField('end_time', v ? new Date(v).toISOString() : null);
									}}
								/>
								{#if fieldErrors.end_time}
									<span class="field-error">{fieldErrors.end_time}</span>
								{/if}
							</div>
						{:else}
							<p class="text-body-sm font-medium text-[var(--text-primary)] hero-text-shadow-sm">{dateStr}</p>
							<p class="text-caption text-[var(--text-secondary)] hero-text-shadow-sm">{timeStr}</p>
						{/if}
					</div>
				</div>

				<!-- Venue -->
				{#if editMode && onUpdateField}
					<div class="flex items-center gap-3 min-h-8" data-animate="info-item">
						<MapPin
							size={18}
							weight="regular"
							class="text-[var(--accent-primary)] shrink-0"
						/>
						<div class="hero-venue-edit">
							<InlineTextInput
								value={event.venue_name || ''}
								oninput={(v) => onUpdateField('venue_name', v)}
								placeholder="Venue name"
								class="text-body-sm font-medium text-[var(--text-primary)] hero-text-shadow-sm"
							/>
							<InlineTextInput
								value={event.venue_address || ''}
								oninput={(v) => onUpdateField('venue_address', v)}
								placeholder="Address"
								class="text-caption text-[var(--text-secondary)] hero-text-shadow-sm"
							/>
						</div>
					</div>
				{:else if venueName || venueAddress}
					<div class="flex items-center gap-3 min-h-8" data-animate="info-item">
						<MapPin
							size={18}
							weight="regular"
							class="text-[var(--accent-primary)] shrink-0"
						/>
						<div>
							<p class="text-body-sm font-medium text-[var(--text-primary)] hero-text-shadow-sm">
								{venueName}
							</p>
							{#if venueAddress}
								<p class="text-caption text-[var(--text-secondary)] hero-text-shadow-sm">
									{venueAddress}
								</p>
							{/if}
						</div>
					</div>
				{:else if event.location_hidden}
					<div class="flex items-center gap-3 min-h-8">
						<MapPin
							size={18}
							weight="regular"
							class="text-[var(--text-muted)] shrink-0"
						/>
						<p class="text-body-sm text-[var(--text-muted)] hero-text-shadow-sm">
							Location revealed after RSVP
						</p>
					</div>
				{/if}

				<!-- Custom link -->
				{#if editMode && onUpdateField}
					<div class="flex items-center gap-3 min-h-8" data-animate="info-item">
						<LinkSimple
							size={18}
							weight="regular"
							class="text-[var(--accent-primary)] shrink-0"
						/>
						<div class="hero-venue-edit">
							<InlineTextInput
								value={event.link_url || ''}
								oninput={(v) => onUpdateField('link_url', v)}
								placeholder="https://..."
								class="text-body-sm font-medium text-[var(--text-primary)] hero-text-shadow-sm"
							/>
							<InlineTextInput
								value={event.link_title || ''}
								oninput={(v) => onUpdateField('link_title', v)}
								placeholder="Link text (optional)"
								class="text-caption text-[var(--text-secondary)] hero-text-shadow-sm"
							/>
						</div>
					</div>
				{:else if event.link_url}
					<div class="flex items-center gap-3 min-h-8" data-animate="info-item">
						<LinkSimple
							size={18}
							weight="regular"
							class="text-[var(--accent-primary)] shrink-0"
						/>
						<a href={event.link_url} target="_blank" rel="noopener noreferrer" class="hero-link text-body-sm font-medium hero-text-shadow-sm">
							{event.link_title || event.link_url}
						</a>
					</div>
				{/if}

				<!-- Inspo boards -->
			{#if editMode && onUpdateField}
				<div class="flex flex-col gap-2" data-animate="info-item">
					{#each inspoItems as item, i}
						{#if isPinterestBoardEntry(item)}
							<div class="flex items-center gap-3 min-h-8">
								<Palette size={18} weight="regular" class="text-[var(--accent-primary)] shrink-0" />
								<span class="text-body-sm font-medium text-[var(--text-primary)] hero-text-shadow-sm" style="flex:1; opacity:0.8;">📌 {item.name}</span>
								<button
									type="button"
									class="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
									onclick={() => removeInspoItem(i)}
									aria-label="Remove Pinterest board"
								>
									<XIcon size={14} weight="bold" />
								</button>
							</div>
						{:else if typeof item === 'string'}
							<div class="flex items-center gap-3 min-h-8">
								<Palette size={18} weight="regular" class="text-[var(--accent-primary)] shrink-0" />
								<div class="hero-venue-edit" style="flex:1">
									<InlineTextInput
										value={item}
										oninput={(v) => {
											const updated = [...inspoItems];
											updated[i] = v;
											onUpdateField?.('inspo_urls', updated);
										}}
										placeholder="Google Slides URL"
										class="text-body-sm font-medium text-[var(--text-primary)] hero-text-shadow-sm"
									/>
								</div>
								<button
									type="button"
									class="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
									onclick={() => removeInspoItem(i)}
									aria-label="Remove inspo URL"
								>
									<XIcon size={14} weight="bold" />
								</button>
							</div>
						{/if}
					{/each}
					{#if inspoItems.length < 3}
						<div class="flex items-center gap-3 min-h-8">
							<Palette size={18} weight="regular" class="shrink-0 text-[var(--text-muted)]" />
							<button
								type="button"
								class="text-body-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors hero-text-shadow-sm"
								onclick={() => { boardPickerOpen = true; }}
							>
								+ Pinterest board
							</button>
							<span class="text-[var(--border-default)]">|</span>
							<button
								type="button"
								class="text-body-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors hero-text-shadow-sm"
								onclick={addInspoUrl}
							>
								+ Google Slides
							</button>
						</div>
					{/if}
				</div>
			{:else if hasRecognizedInspo}
				<div class="flex items-center gap-3 min-h-8" data-animate="info-item">
					<Palette
						size={18}
						weight="regular"
						class="text-[var(--accent-primary)] shrink-0"
					/>
					<button
						type="button"
						class="hero-link text-body-sm font-medium hero-text-shadow-sm"
						onclick={() => { inspoDialogOpen = true; }}
					>
						View Inspo Board
					</button>
				</div>
			{/if}

			<!-- RSVP counts -->
				<div class="flex items-center gap-3 min-h-8" data-animate="info-item">
					<Users
						size={18}
						weight="regular"
						class="text-[var(--accent-primary)] shrink-0"
					/>
					<p class="flex-1 text-body-sm text-[var(--text-secondary)] hero-text-shadow-sm">
						<NumberTicker value={rsvpCounts.going} class="font-medium text-[var(--text-primary)]" />
						going
						{#if rsvpCounts.maybe > 0}
							<span class="text-[var(--text-muted)]">&middot;</span>
							<span class="font-medium text-[var(--text-primary)]"
								>{rsvpCounts.maybe}</span
							>
							maybe
						{/if}
					</p>
					{#if showGuestListLink && onViewGuestList}
						<button
							class="text-label-sm text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition-colors hero-text-shadow-sm"
							onclick={onViewGuestList}
						>
							View Guests
						</button>
					{/if}
				</div>

				<!-- Ticket price -->
				{#if isTicketedEvent(event)}
					<div class="flex items-center gap-3 min-h-8" data-animate="info-item">
						<Ticket
							size={18}
							weight="regular"
							class="text-[var(--accent-primary)] shrink-0"
						/>
						<p class="text-body-sm font-medium text-[var(--text-primary)] hero-text-shadow-sm">
							{formatPrice(event.ticket_price_cents!)}
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Bottom group — CTA + branding, pinned to bottom, delayed entrance -->
		<div class="w-full max-w-lg space-y-4 hero-delayed-entrance">
			{#if cta}
				<div data-animate="cta">
					{@render cta()}
				</div>
			{/if}
			<div class="hero-branding-row">
				<a href="/" class="flex items-center gap-2 no-underline">
					<span class="text-caption text-[var(--text-muted)] hero-text-shadow-sm">powered by</span>
					<img
						src="/landing/logo-full-white.png"
						alt="Ephemeral"
						class="h-4 opacity-50 logo-themed"
					/>
				</a>
				<span class="hero-branding-sep" aria-hidden="true"></span>
				<button class="hero-branding-support" onclick={openSupport}>Support</button>
			</div>
		</div>
	</div>
</section>

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
	/* Cover is taller than section to give Motion room to translate.
	   top: -20% provides headroom; bottom: 0 anchors to section bottom.
	   Motion animates y: 0% → -20% (moves up 20% of its own height). */
	.parallax-cover {
		position: absolute;
		top: -20%;
		right: 0;
		bottom: 0;
		left: 0;
		will-change: transform;
	}

	.scrim-gradient {
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--surface-base) 25%, transparent) 0%,
			color-mix(in srgb, var(--surface-base) 35%, transparent) 20%,
			color-mix(in srgb, var(--surface-base) 60%, transparent) 40%,
			color-mix(in srgb, var(--surface-base) 85%, transparent) 60%,
			color-mix(in srgb, var(--surface-base) 95%, transparent) 75%,
			var(--surface-base) 88%
		);
	}

	.hero-text-shadow {
		text-shadow: 0 2px 12px color-mix(in srgb, var(--surface-base) 80%, transparent),
			0 4px 24px color-mix(in srgb, var(--surface-base) 50%, transparent);
	}

	.hero-text-shadow-sm {
		text-shadow: 0 1px 6px color-mix(in srgb, var(--surface-base) 70%, transparent),
			0 2px 16px color-mix(in srgb, var(--surface-base) 40%, transparent);
	}

	.hero-text-shadow-subtle {
		text-shadow: 0 1px 4px color-mix(in srgb, var(--surface-base) 30%, transparent);
	}

	/* Theme-specific vignette overlays */
	:global([data-theme='forest']) .scrim-gradient::after {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at center, transparent 50%, rgba(45, 106, 79, 0.15) 100%);
		pointer-events: none;
	}

	:global([data-theme='sakura']) .scrim-gradient::after {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at center, transparent 50%, rgba(224, 122, 147, 0.12) 100%);
		pointer-events: none;
	}

	:global([data-theme='garden']) .scrim-gradient::after {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at center, transparent 50%, rgba(233, 180, 76, 0.12) 100%);
		pointer-events: none;
	}

	/* Delayed entrance for bottom group (CTA + branding) — 1s after page load */
	.hero-delayed-entrance {
		opacity: 0;
		transform: translateY(12px);
		animation: heroDelayedFadeIn 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) 1s forwards;
	}

	@keyframes heroDelayedFadeIn {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Light mode: invert white logo to dark */
	:global([data-mode='light']) .logo-themed {
		filter: invert(1);
	}

	/* ── Branding row with support link ─────────────────────── */

	.hero-branding-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.hero-branding-sep {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--text-muted);
		opacity: 0.3;
	}

	.hero-branding-support {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.6875rem;
		color: var(--text-muted);
		opacity: 0.5;
		cursor: pointer;
		transition: opacity 150ms ease;
		text-shadow: 0 1px 6px color-mix(in srgb, var(--surface-base) 70%, transparent);
	}

	.hero-branding-support:hover {
		opacity: 0.8;
	}

	.hero-branding-support:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 2px;
	}

	/* Cover change button — small pill in top-right */
	.hero-cover-change-btn {
		position: absolute;
		top: max(12px, env(safe-area-inset-top, 12px));
		right: 12px;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.5);
		color: #ede9e3;
		cursor: pointer;
		transition: background 150ms ease;
		backdrop-filter: blur(8px);
	}

	.hero-cover-change-btn:hover {
		background: rgba(0, 0, 0, 0.7);
	}

	/* Visible date input (edit mode) */
	.hero-date-input {
		background: transparent;
		border: 1px dashed color-mix(in srgb, var(--text-secondary) 40%, transparent);
		border-radius: 4px;
		outline: none;
		font: inherit;
		color: inherit;
		padding: 2px 6px;
		margin: -2px -6px;
		transition: all 150ms ease;
		color-scheme: dark;
		width: auto;
	}

	.hero-date-input:hover {
		background: color-mix(in srgb, var(--text-primary) 5%, transparent);
		border-color: color-mix(in srgb, var(--text-secondary) 60%, transparent);
	}

	.hero-date-input:focus {
		border-color: color-mix(in srgb, var(--text-primary) 50%, transparent);
		background: color-mix(in srgb, var(--text-primary) 5%, transparent);
	}

	/* Upload overlay covers the full hero section */
	.hero-upload-overlay-wrapper {
		position: absolute;
		inset: 0;
		z-index: 10;
		pointer-events: none;
	}

	/* Venue edit fields */
	.hero-venue-edit {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 160px;
	}

	.hero-content-overlay {
		min-height: 100dvh;
		z-index: 1;
	}

	@media (orientation: landscape) {
		section {
			min-height: 65dvh !important;
		}
		.hero-content-overlay {
			min-height: 65dvh;
		}
	}

	.hero-link {
		color: var(--accent-primary, #52b788);
		text-decoration: underline;
		text-underline-offset: 2px;
		transition: opacity 150ms ease;
		word-break: break-all;
	}

	.hero-link:hover {
		opacity: 0.8;
	}

	.hero-field-col {
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
	}
</style>
