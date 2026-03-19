<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ShareNetwork, CalendarPlus } from 'phosphor-svelte';
	import { AESTHETIC_COPY } from '$lib/utils/aesthetic-copy';
	import { scrollReveal, pressFeedback } from '$lib/motion';
	import HeroCover from '$lib/components/event/HeroCover.svelte';
	import type { PublicEvent, RsvpCounts } from '$lib/utils/event-helpers';
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

	const copy = AESTHETIC_COPY.rsvp.fun;
</script>

<article class="fun-layout" data-testid="fun-layout">
	<!-- Hero section: always render HeroCover, pass editMode through -->
	<HeroCover
		coverKey={event.cover_r2_key}
		title={event.title || 'Untitled Event'}
		host={host as import('$lib/utils/event-helpers').EventHost | null}
		event={event as unknown as PublicEvent}
		rsvpCounts={rsvpCounts as RsvpCounts}
		showGuestListLink={!!onViewGuests}
		onViewGuestList={onViewGuests}
		{editMode}
		{onUpdateField}
		{onUploadCover}
		coverPreviewUrl={event.cover_preview_url || null}
		coverIsVideo={event.cover_is_video || false}
	>
		{#snippet cta()}
			{#if ctaSlot}
				{@render ctaSlot()}
			{/if}
		{/snippet}
	</HeroCover>

	<!-- Content section (rounded top, overlaps hero) -->
	<main class="fun-content">
		{#if !editMode && (onShare || onDownloadCalendar)}
			<div class="fun-actions" use:scrollReveal={{ y: 15 }}>
				{#if onDownloadCalendar}
					<button class="fun-action-btn" use:pressFeedback onclick={onDownloadCalendar}>
						<span class="fun-icon-accent"><CalendarPlus size={16} weight="regular" /></span>
						Add to Calendar
					</button>
				{/if}
				{#if onShare}
					<button class="fun-action-btn" use:pressFeedback onclick={onShare}>
						<span class="fun-icon-accent"><ShareNetwork size={16} weight="regular" /></span>
						Share
					</button>
				{/if}
			</div>
		{/if}

	</main>

	<!-- Fixed RSVP bar — uses shared scroll-dependent positioning -->
	{#if showRsvpBar && !editMode}
		<div
			class="fun-rsvp-bar rsvp-bar-transition"
			class:rsvp-bar-frosted={rsvpScrolled}
			data-testid="rsvp-buttons"
			style="bottom: {rsvpScrolled ? 'max(12px, calc(var(--safe-bottom, env(safe-area-inset-bottom)) + 8px))' : 'calc(11dvh)'};"
		>
			<div class="fun-rsvp-inner">
				<button class="fun-cta fun-cta-primary" use:pressFeedback onclick={() => onRsvp?.('going')}>
					{copy.going}
				</button>
				<button class="fun-cta fun-cta-secondary" use:pressFeedback onclick={() => onRsvp?.('maybe')}>
					{copy.maybe}
				</button>
				<button class="fun-cta fun-cta-tertiary" use:pressFeedback onclick={() => onRsvp?.('declined')}>
					{copy.decline}
				</button>
			</div>
		</div>
	{/if}
</article>

<style>
	.fun-layout {
		min-height: 100dvh;
		background: var(--background);
		color: var(--foreground);
		font-family: var(--font-body, 'Manrope', sans-serif);
	}

	/* Content section */
	.fun-content {
		position: relative;
		z-index: 10;
		max-width: 512px;
		margin: 0 auto;
		padding: 16px 16px 112px;
		border-radius: 16px 16px 0 0;
		background: radial-gradient(
			ellipse at 50% 0%,
			color-mix(in oklch, var(--primary) 8%, var(--background)) 0%,
			var(--background) 55%
		);
		isolation: isolate;
	}

	.fun-actions {
		display: flex;
		gap: 8px;
	}

	/* Accent-colored icons in action buttons */
	.fun-icon-accent {
		color: color-mix(in oklch, var(--primary) 50%, var(--foreground));
		display: flex;
	}

	.fun-action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: 9999px;
		background: var(--card);
		border: 1px solid var(--border);
		color: var(--foreground);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.fun-action-btn:hover {
		background: color-mix(in oklch, var(--primary) 12%, var(--card));
		border-color: color-mix(in oklch, var(--primary) 20%, var(--border));
	}

	.fun-action-btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* Fixed RSVP bar — position controlled by inline style (shared scroll logic) */
	.fun-rsvp-bar {
		position: fixed;
		left: 0;
		right: 0;
		z-index: 50;
	}

	.rsvp-bar-transition {
		transition: bottom 0.35s cubic-bezier(0.25, 0.1, 0.25, 1),
			background 0.3s ease,
			backdrop-filter 0.3s ease;
	}

	.rsvp-bar-frosted {
		background: color-mix(in srgb, var(--background) 80%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
	}

	.fun-rsvp-inner {
		max-width: 512px;
		margin: 0 auto;
		padding: 0 16px;
		display: flex;
		gap: 8px;
	}

	.fun-cta {
		flex: 1;
		aspect-ratio: 2.2;
		border-radius: 16px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 150ms ease;
		border: none;
	}

	.fun-cta:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.fun-cta-primary {
		background: var(--primary);
		color: var(--primary-foreground);
		box-shadow: var(--shadow-md);
	}

	.fun-cta-primary:hover {
		background: var(--ring);
	}

	.fun-cta-secondary {
		background: color-mix(in srgb, var(--background) 20%, transparent);
		border: 2px solid var(--border);
		color: var(--foreground);
		backdrop-filter: blur(8px);
	}

	.fun-cta-secondary:hover {
		background: color-mix(in srgb, var(--card) 40%, transparent);
	}

	.fun-cta-tertiary {
		background: transparent;
		border: 2px solid var(--border);
		color: var(--muted-foreground);
		opacity: 0.7;
	}

	.fun-cta-tertiary:hover {
		background: color-mix(in srgb, var(--card) 20%, transparent);
		opacity: 1;
	}
</style>
