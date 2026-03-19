<script lang="ts">
	import { ArrowLeft, CalendarBlank, Users, MapPin, ArrowSquareOut, Trash, Ticket, CurrencyDollar, Camera, ChatDots, UserCircle, ChartLineUp, Megaphone, ListBullets } from 'phosphor-svelte';
	import { animateIn, scrollReveal } from '$lib/motion';

	interface AdminEvent {
		event_id: string;
		title: string;
		description?: string;
		start_time: string;
		end_time?: string;
		timezone?: string;
		slug?: string;
		visibility: string;
		aesthetic?: string;
		palette?: string;
		web_event_type?: string;
		created_at: string;
		expires_at: string;
		deleted_at?: string;
		venue_name?: string;
		venue_address?: string;
		host_display_name?: string;
		host_phone?: string;
		going_count: number;
		total_invites: number;
	}

	interface PlatformStats {
		total_events: number;
		active_events: number;
		unique_hosts: number;
		total_rsvps_going: number;
		total_rsvps_all: number;
		unique_guests: number;
		total_users: number;
		tickets_sold: number;
		tickets_refunded: number;
		gross_revenue_cents: number;
		fees_absorbed_cents: number;
		total_checkins: number;
		total_photos: number;
		total_comments: number;
		ticketed_events: number;
		text_blasts_sent: number;
		text_blast_recipients: number;
		visibility_breakdown: Record<string, number>;
		tracking_since: string | null;
		waitlist_total: number;
		waitlist_founders: number;
	}

	let events = $state<AdminEvent[]>([]);
	let stats = $state<PlatformStats | null>(null);
	let loading = $state(true);
	let statsLoading = $state(true);
	let error = $state('');

	$effect(() => {
		loadEvents();
		loadStats();
	});

	async function loadStats() {
		statsLoading = true;
		try {
			const res = await fetch('/api/admin/stats');
			if (res.ok) {
				const json = (await res.json()) as { stats?: PlatformStats };
				stats = json.stats ?? null;
			}
		} catch {
			// Stats are non-critical, silently fail
		} finally {
			statsLoading = false;
		}
	}

	async function loadEvents() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/admin/events');
			if (res.status === 401) {
				error = 'Not authenticated';
				return;
			}
			if (res.status === 403) {
				error = 'Access denied';
				return;
			}
			const json = (await res.json()) as { events?: AdminEvent[]; error?: string };
			if (!res.ok) {
				error = json.error || 'Failed to load events';
				return;
			}
			events = json.events || [];
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}

	function formatCents(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2
		}).format(cents / 100);
	}

	function formatNumber(n: number): string {
		return new Intl.NumberFormat('en-US').format(n);
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function timeAgo(iso: string): string {
		const now = Date.now();
		const then = new Date(iso).getTime();
		const diff = now - then;
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.floor(hrs / 24);
		if (days < 30) return `${days}d ago`;
		return formatDate(iso);
	}

	function sinceLabel(iso: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function visibilityLabel(v: string): string {
		if (v === 'public') return 'Public';
		if (v === 'followers') return 'Followers';
		return 'Invite only';
	}
</script>

<svelte:head>
	<title>Admin - All Events</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="admin-page">
	<header class="admin-header" use:animateIn={{ delay: 0 }}>
		<a href="/events" class="back-btn" aria-label="Back to dashboard">
			<ArrowLeft size={20} weight="bold" />
		</a>
		<div>
			<h1 class="admin-title">Admin Dashboard</h1>
			{#if stats?.tracking_since}
				<p class="admin-count">Tracking since {sinceLabel(stats.tracking_since)}</p>
			{/if}
		</div>
	</header>

	<!-- Stats Dashboard -->
	{#if stats}
		<section class="stats-dashboard" use:animateIn={{ delay: 50 }}>
			<div class="stats-grid">
				<div class="stat-card stat-primary">
					<div class="stat-icon"><CalendarBlank size={18} weight="duotone" /></div>
					<div class="stat-value">{formatNumber(stats.total_events)}</div>
					<div class="stat-label">Events Created</div>
					<div class="stat-sub">{formatNumber(stats.active_events)} active</div>
				</div>

				<div class="stat-card stat-primary">
					<div class="stat-icon"><Users size={18} weight="duotone" /></div>
					<div class="stat-value">{formatNumber(stats.total_rsvps_going)}</div>
					<div class="stat-label">RSVPs (Going)</div>
					<div class="stat-sub">{formatNumber(stats.total_rsvps_all)} total responses</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon"><UserCircle size={18} weight="duotone" /></div>
					<div class="stat-value">{formatNumber(stats.total_users)}</div>
					<div class="stat-label">Registered Users</div>
					<div class="stat-sub">{formatNumber(stats.unique_hosts)} hosts, {formatNumber(stats.unique_guests)} guests</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon"><Ticket size={18} weight="duotone" /></div>
					<div class="stat-value">{formatNumber(stats.tickets_sold)}</div>
					<div class="stat-label">Tickets Sold</div>
					<div class="stat-sub">{formatNumber(stats.ticketed_events)} ticketed events{#if stats.tickets_refunded > 0}, {formatNumber(stats.tickets_refunded)} refunded{/if}</div>
				</div>

				<div class="stat-card stat-money">
					<div class="stat-icon"><CurrencyDollar size={18} weight="duotone" /></div>
					<div class="stat-value">{formatCents(stats.gross_revenue_cents)}</div>
					<div class="stat-label">Gross Ticket Sales</div>
					<div class="stat-sub">{formatNumber(stats.total_checkins)} checked in</div>
				</div>

				<div class="stat-card stat-money">
					<div class="stat-icon"><ChartLineUp size={18} weight="duotone" /></div>
					<div class="stat-value">{formatCents(stats.fees_absorbed_cents)}</div>
					<div class="stat-label">Fees Absorbed</div>
					<div class="stat-sub">Ephemeral's cost</div>
				</div>
			</div>

			<div class="stats-grid" style="margin-top: 8px;">
				<div class="stat-card">
					<div class="stat-icon"><ListBullets size={18} weight="duotone" /></div>
					<div class="stat-value">{formatNumber(stats.waitlist_total ?? 0)}</div>
					<div class="stat-label">Waitlist Signups</div>
					<div class="stat-sub">{formatNumber(stats.waitlist_founders ?? 0)} paid founders</div>
				</div>
			</div>

			<!-- Secondary stats row -->
			<div class="stats-secondary">
				<div class="stat-pill">
					<Camera size={13} weight="regular" />
					<span>{formatNumber(stats.total_photos)} photos</span>
				</div>
				<div class="stat-pill">
					<ChatDots size={13} weight="regular" />
					<span>{formatNumber(stats.total_comments)} comments</span>
				</div>
				{#if stats.text_blasts_sent > 0}
					<div class="stat-pill">
						<Megaphone size={13} weight="regular" />
						<span>{formatNumber(stats.text_blasts_sent)} blasts to {formatNumber(stats.text_blast_recipients)}</span>
					</div>
				{/if}
				{#if stats.visibility_breakdown}
					{#each Object.entries(stats.visibility_breakdown) as [vis, count]}
						<div class="stat-pill">
							<span>{formatNumber(count)} {visibilityLabel(vis).toLowerCase()}</span>
						</div>
					{/each}
				{/if}
			</div>
		</section>
	{:else if statsLoading}
		<div class="stats-skeleton" use:animateIn={{ delay: 50 }}>
			<div class="skeleton-grid">
				{#each Array(6) as _}
					<div class="skeleton-card"></div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Events Section Header -->
	{#if !loading && !error}
		<h2 class="section-title" use:scrollReveal={{ y: 10 }}>All Events <span class="section-count">{events.length}</span></h2>
	{/if}

	{#if loading}
		<p class="status-text">Loading...</p>
	{:else if error}
		<div class="error-card">
			<p class="error-text">{error}</p>
		</div>
	{:else if events.length === 0}
		<p class="status-text">No events yet</p>
	{:else}
		<div class="events-list">
			{#each events as event, i (event.event_id)}
				<div
					class="event-card"
					class:event-deleted={!!event.deleted_at}
					use:scrollReveal={{ y: 12, delay: Math.min(i * 30, 300) }}
				>
					<div class="card-top">
						<div class="card-title-row">
							<h3 class="card-title">
								{event.title}
								{#if event.deleted_at}
									<Trash size={14} weight="bold" class="deleted-icon" />
								{/if}
							</h3>
							{#if event.slug}
								<a
									href="/e/{event.slug}"
									target="_blank"
									rel="noopener noreferrer"
									class="open-link"
									aria-label="Open event page"
								>
									<ArrowSquareOut size={16} weight="bold" />
								</a>
							{/if}
						</div>

						<div class="card-badges">
							<span class="badge badge-visibility">{visibilityLabel(event.visibility)}</span>
							{#if event.aesthetic}
								<span class="badge badge-aesthetic">{event.aesthetic}{event.palette ? `/${event.palette}` : ''}</span>
							{/if}
							{#if event.web_event_type === 'ticketed'}
								<span class="badge badge-ticketed">Ticketed</span>
							{/if}
						</div>
					</div>

					<div class="card-meta">
						<span class="meta-item">
							<CalendarBlank size={13} weight="regular" />
							{formatDate(event.start_time)}
						</span>
						<span class="meta-item">
							<Users size={13} weight="regular" />
							{event.going_count} going / {event.total_invites} invited
						</span>
						{#if event.venue_name}
							<span class="meta-item">
								<MapPin size={13} weight="regular" />
								{event.venue_name}
							</span>
						{/if}
					</div>

					<div class="card-bottom">
						<span class="host-name">
							{event.host_display_name || 'Unknown host'}
						</span>
						<span class="created-at" title={formatDate(event.created_at)}>
							Created {timeAgo(event.created_at)}
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</main>

<style>
	.admin-page {
		max-width: 680px;
		margin: 0 auto;
		padding: 24px 16px 64px;
	}

	.admin-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 24px;
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 1px solid var(--border-default);
		color: var(--text-primary);
		transition: background 150ms ease;
		flex-shrink: 0;
	}

	.back-btn:hover {
		background: var(--surface-overlay);
	}

	.admin-title {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.2;
	}

	.admin-count {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: var(--text-muted);
		margin: 2px 0 0;
	}

	.status-text {
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--text-muted);
		text-align: center;
		padding: 48px 0;
	}

	.error-card {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: 0.75rem;
		padding: 24px;
		text-align: center;
	}

	.error-text {
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--feedback-error, #e85d04);
		margin: 0;
	}

	.events-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.event-card {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: 0.75rem;
		padding: 14px 16px;
		transition: border-color 150ms ease;
	}

	.event-card:hover {
		border-color: var(--border-default);
	}

	.event-deleted {
		opacity: 0.5;
	}

	.card-top {
		margin-bottom: 8px;
	}

	.card-title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 8px;
	}

	.card-title {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.35;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	:global(.deleted-icon) {
		color: var(--feedback-error, #e85d04);
		flex-shrink: 0;
	}

	.open-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		color: var(--text-muted);
		transition: all 150ms ease;
		flex-shrink: 0;
	}

	.open-link:hover {
		color: var(--accent-primary);
		background: var(--surface-overlay);
	}

	.card-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 6px;
	}

	.badge {
		font-family: var(--font-body);
		font-size: 0.6875rem;
		font-weight: 500;
		padding: 2px 8px;
		border-radius: 9999px;
		line-height: 1.4;
	}

	.badge-visibility {
		background: rgba(107, 101, 96, 0.15);
		color: var(--text-secondary);
	}

	.badge-aesthetic {
		background: rgba(82, 183, 136, 0.12);
		color: var(--accent-primary);
	}

	.badge-ticketed {
		background: rgba(232, 93, 4, 0.12);
		color: var(--feedback-error, #e85d04);
	}

	.card-meta {
		display: flex;
		flex-direction: column;
		gap: 3px;
		margin-bottom: 10px;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 5px;
		font-family: var(--font-body);
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.card-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 8px;
		border-top: 1px solid var(--border-subtle);
	}

	.host-name {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.created-at {
		font-family: var(--font-body);
		font-size: 0.6875rem;
		color: var(--text-muted);
	}

	/* Stats Dashboard */
	.stats-dashboard {
		margin-bottom: 32px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
		margin-bottom: 10px;
	}

	@media (min-width: 520px) {
		.stats-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.stat-card {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: 0.75rem;
		padding: 14px 14px 12px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat-primary {
		border-color: rgba(82, 183, 136, 0.15);
	}

	.stat-money {
		border-color: rgba(232, 93, 4, 0.12);
	}

	.stat-icon {
		color: var(--text-muted);
		margin-bottom: 4px;
		line-height: 1;
	}

	.stat-primary .stat-icon {
		color: var(--accent-primary, #52b788);
	}

	.stat-money .stat-icon {
		color: var(--feedback-error, #e85d04);
	}

	.stat-value {
		font-family: var(--font-heading);
		font-size: 1.375rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.15;
		letter-spacing: -0.01em;
	}

	.stat-label {
		font-family: var(--font-body);
		font-size: 0.6875rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		line-height: 1.3;
	}

	.stat-sub {
		font-family: var(--font-body);
		font-size: 0.6875rem;
		color: var(--text-muted);
		line-height: 1.3;
		margin-top: 1px;
	}

	/* Secondary stats pills */
	.stats-secondary {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.stat-pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: var(--font-body);
		font-size: 0.6875rem;
		color: var(--text-muted);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: 9999px;
		padding: 3px 10px;
		line-height: 1.4;
	}

	/* Section title for events list */
	.section-title {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 12px;
	}

	.section-count {
		font-weight: 400;
		color: var(--text-muted);
	}

	/* Stats skeleton loading */
	.stats-skeleton {
		margin-bottom: 32px;
	}

	.skeleton-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}

	@media (min-width: 520px) {
		.skeleton-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.skeleton-card {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: 0.75rem;
		height: 88px;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 0.7; }
	}
</style>
