<script lang="ts">
	import { PinterestLogo, Presentation, ArrowSquareOut, X, CaretLeft, CaretRight, SpinnerGap } from 'phosphor-svelte';
	import {
		getInspoType,
		getGoogleSlidesEmbedUrl,
		getInspoUrl,
		getInspoLabel,
		isPinterestBoardEntry,
		type InspoItem
	} from '$lib/utils/inspo';
	import { staggerChildren } from '$lib/motion';

	interface PinData {
		id: string;
		title: string | null;
		image_url: string | null;
		width: number;
		height: number;
	}

	interface BoardPinData {
		board: { id: string; name: string; url: string | null; pin_count: number } | null;
		pins: PinData[];
		loading: boolean;
		error: boolean;
	}

	interface Props {
		open: boolean;
		items: InspoItem[];
		hostUserId: string;
		onClose: () => void;
	}

	let { open, items: rawItems, hostUserId, onClose }: Props = $props();

	// Sort items: Pinterest boards first, then Google Slides / other URLs
	let items = $derived([...rawItems].sort((a, b) => {
		const aIsPinterest = isPinterestBoardEntry(a) ? 0 : 1;
		const bIsPinterest = isPinterestBoardEntry(b) ? 0 : 1;
		return aIsPinterest - bIsPinterest;
	}));

	let activeIndex = $state(0);

	// Pin data cache: board_id -> { board, pins, loading, error }
	let pinCache = $state<Record<string, BoardPinData>>({});

	// Reset active index when dialog opens
	$effect(() => {
		if (open) {
			activeIndex = 0;
		}
	});

	// Fetch pins for structured Pinterest boards when dialog opens
	$effect(() => {
		if (!open) return;
		for (const item of items) {
			if (isPinterestBoardEntry(item) && !pinCache[item.board_id]) {
				fetchBoardPins(item.board_id);
			}
		}
	});

	async function fetchBoardPins(boardId: string) {
		pinCache[boardId] = { board: null, pins: [], loading: true, error: false };
		// Force reactivity
		pinCache = { ...pinCache };

		try {
			const res = await fetch(
				`/api/pinterest-board?board_id=${boardId}&host_id=${encodeURIComponent(hostUserId)}`
			);
			const data = (await res.json()) as { board: BoardPinData['board']; pins: PinData[] };
			pinCache[boardId] = { board: data.board, pins: data.pins || [], loading: false, error: !res.ok };
		} catch {
			pinCache[boardId] = { board: null, pins: [], loading: false, error: true };
		}
		pinCache = { ...pinCache };
	}

	let currentItem = $derived(items[activeIndex]);
	let currentType = $derived(currentItem ? getInspoType(currentItem) : 'unknown');
	let hasMultiple = $derived(items.length > 1);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
		if (hasMultiple && e.key === 'ArrowLeft' && activeIndex > 0) activeIndex--;
		if (hasMultiple && e.key === 'ArrowRight' && activeIndex < items.length - 1) activeIndex++;
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="inspo-dialog"
		class:inspo-dialog-open={open}
		role="dialog"
		aria-modal="true"
		aria-label="Inspo Board"
		tabindex="0"
		onkeydown={handleKeydown}
	>
		<!-- Header -->
		<div class="dialog-header">
			<h2 class="font-serif text-lg font-semibold text-[var(--text-primary)]">Inspo Board</h2>

			{#if hasMultiple}
				<div class="tab-bar">
					{#each items as item, i}
						<button
							type="button"
							class="tab"
							class:tab-active={i === activeIndex}
							onclick={() => { activeIndex = i; }}
						>
							{#if getInspoType(item) === 'pinterest'}
								<PinterestLogo size={14} weight={i === activeIndex ? 'fill' : 'regular'} />
							{:else}
								<Presentation size={14} weight={i === activeIndex ? 'fill' : 'regular'} />
							{/if}
							{getInspoLabel(item)}
						</button>
					{/each}
				</div>
			{/if}

			<button
				type="button"
				class="close-btn"
				onclick={onClose}
				aria-label="Close inspo board"
			>
				<X size={20} weight="bold" />
			</button>
		</div>

		<!-- Content -->
		<div class="dialog-content">
			{#if currentItem && currentType === 'google-slides' && typeof currentItem === 'string'}
				<div class="slides-container">
					<iframe
						src={getGoogleSlidesEmbedUrl(currentItem)}
						title="Google Slides presentation"
						allowfullscreen
						frameborder="0"
						class="slides-iframe"
						allow="autoplay"
					></iframe>
				</div>

			{:else if currentItem && currentType === 'pinterest' && isPinterestBoardEntry(currentItem)}
				{@const boardData = pinCache[currentItem.board_id]}
				{@const boardUrl = boardData?.board?.url || getInspoUrl(currentItem)}
				{#if boardData?.loading}
					<!-- Skeleton loading grid -->
					<div class="pin-board-header">
						<PinterestLogo size={18} weight="fill" color="#E60023" />
						<span class="pin-board-name">{currentItem.name}</span>
					</div>
					<div class="pin-grid">
						{#each Array(6) as _}
							<div class="pin-skeleton">
								<div class="pin-skeleton-img"></div>
							</div>
						{/each}
					</div>

				{:else if boardData && boardData.pins.length > 0}
					<!-- Pin grid -->
					<div class="pin-board-header">
						<PinterestLogo size={18} weight="fill" color="#E60023" />
						<span class="pin-board-name">{boardData.board?.name || currentItem.name}</span>
						<a
							href={boardUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="pin-board-link"
						>
							<ArrowSquareOut size={14} weight="bold" />
						</a>
					</div>
					<div class="pin-grid" use:staggerChildren={{ selector: '.pin-card', stagger: 0.04, y: 16 }}>
						{#each boardData.pins as pin}
							{#if pin.image_url}
								<a
									href={`https://www.pinterest.com/pin/${pin.id}/`}
									target="_blank"
									rel="noopener noreferrer"
									class="pin-card"
								>
									<img
										src={pin.image_url}
										alt={pin.title || 'Pin'}
										class="pin-img"
										loading="lazy"
									/>
								</a>
							{/if}
						{/each}
					</div>
					<div class="pin-footer">
						<a
							href={boardUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="pin-view-all"
						>
							View all {boardData.board?.pin_count || ''} pins on Pinterest
							<ArrowSquareOut size={14} weight="bold" />
						</a>
					</div>

				{:else}
					<!-- Fallback: link card for structured entries with no pins or error -->
					<a
						href={boardUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="pinterest-card"
					>
						<div class="pinterest-card-content">
							<div class="pinterest-icon">
								<PinterestLogo size={28} weight="fill" />
							</div>
							<p class="pinterest-board-name">
								{currentItem.name}
							</p>
							<span class="pinterest-cta">
								Open on Pinterest
								<ArrowSquareOut size={14} weight="bold" />
							</span>
						</div>
					</a>
				{/if}

			{:else if currentItem && currentType === 'pinterest' && typeof currentItem === 'string'}
				<!-- Legacy: plain Pinterest URL — show link card -->
				<a
					href={currentItem}
					target="_blank"
					rel="noopener noreferrer"
					class="pinterest-card"
				>
					<div class="pinterest-card-content">
						<div class="pinterest-icon">
							<PinterestLogo size={28} weight="fill" />
						</div>
						<p class="pinterest-board-name">Pinterest Board</p>
						<span class="pinterest-cta">
							Open on Pinterest
							<ArrowSquareOut size={14} weight="bold" />
						</span>
					</div>
				</a>

			{:else if currentItem}
				<div class="fallback-card">
					<p class="text-[var(--text-secondary)] mb-4">This link type isn't supported for inline preview.</p>
					<a
						href={getInspoUrl(currentItem)}
						target="_blank"
						rel="noopener noreferrer"
						class="action-btn"
					>
						Open Link
						<ArrowSquareOut size={16} weight="bold" />
					</a>
				</div>
			{/if}
		</div>

		<!-- Bottom nav arrows for multiple boards -->
		{#if hasMultiple}
			<div class="nav-bar">
				<button
					type="button"
					class="nav-arrow"
					disabled={activeIndex === 0}
					onclick={() => { activeIndex--; }}
					aria-label="Previous board"
				>
					<CaretLeft size={18} weight="bold" />
				</button>
				<span class="nav-label">{activeIndex + 1} of {items.length}</span>
				<button
					type="button"
					class="nav-arrow"
					disabled={activeIndex === items.length - 1}
					onclick={() => { activeIndex++; }}
					aria-label="Next board"
				>
					<CaretRight size={18} weight="bold" />
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.inspo-dialog {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: var(--surface-base);
		display: flex;
		flex-direction: column;
		transform: translateY(100%);
		transition: transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.inspo-dialog-open {
		transform: translateY(0);
	}

	/* ── Header ── */
	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;
		gap: 0.75rem;
	}

	.close-btn {
		padding: 0.375rem;
		border-radius: 0.5rem;
		color: var(--text-muted);
		cursor: pointer;
		background: transparent;
		border: none;
		transition: all 150ms;
		flex-shrink: 0;
	}

	.close-btn:hover {
		color: var(--text-primary);
		background: var(--surface-card);
	}

	/* ── Tabs ── */
	.tab-bar {
		display: flex;
		gap: 0.25rem;
		background: var(--surface-card);
		border-radius: 9999px;
		padding: 0.1875rem;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.tab-bar::-webkit-scrollbar {
		display: none;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.3125rem 0.75rem;
		border-radius: 9999px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms;
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--text-secondary);
	}

	.tab-active {
		background: var(--surface-base);
		color: var(--text-primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	/* ── Content ── */
	.dialog-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.25rem;
		-webkit-overflow-scrolling: touch;
	}

	/* ── Google Slides ── */
	.slides-container {
		width: 100%;
		max-width: 960px;
		margin: 0 auto;
	}

	.slides-iframe {
		width: 100%;
		aspect-ratio: 16 / 9;
		max-height: 80vh;
		border: none;
		border-radius: 0.75rem;
		background: var(--surface-card);
	}

	/* ── Pinterest pin grid ── */
	.pin-board-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.pin-board-name {
		font-family: var(--font-heading, 'Vollkorn Variable', serif);
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 1;
	}

	.pin-board-link {
		color: var(--text-muted);
		transition: color 150ms;
	}

	.pin-board-link:hover {
		color: var(--text-primary);
	}

	.pin-grid {
		column-count: 2;
		column-gap: 0.625rem;
	}

	.pin-card {
		display: block;
		break-inside: avoid;
		margin-bottom: 0.625rem;
		border-radius: 0.5rem;
		overflow: hidden;
		transition: transform 150ms, box-shadow 150ms;
	}

	.pin-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.pin-img {
		width: 100%;
		display: block;
		border-radius: 0.5rem;
		background: var(--surface-card);
	}

	.pin-footer {
		display: flex;
		justify-content: center;
		margin-top: 1.25rem;
	}

	.pin-view-all {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.5rem;
		border-radius: 9999px;
		background: #E60023;
		color: #ede9e3;
		font-weight: 600;
		font-size: 0.8125rem;
		text-decoration: none;
		transition: opacity 150ms;
	}

	.pin-view-all:hover {
		opacity: 0.9;
	}

	/* ── Pin skeleton ── */
	.pin-skeleton {
		break-inside: avoid;
		margin-bottom: 0.625rem;
	}

	.pin-skeleton-img {
		width: 100%;
		aspect-ratio: 3 / 4;
		border-radius: 0.5rem;
		background: linear-gradient(90deg, var(--surface-card, #1a1918) 25%, var(--surface-base, #111110) 50%, var(--surface-card, #1a1918) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.pin-skeleton:nth-child(even) .pin-skeleton-img {
		aspect-ratio: 1 / 1;
	}

	.pin-skeleton:nth-child(3n) .pin-skeleton-img {
		aspect-ratio: 4 / 5;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	/* ── Pinterest link card (legacy) ── */
	.pinterest-card {
		display: block;
		position: relative;
		overflow: hidden;
		border-radius: 0.75rem;
		max-width: 420px;
		margin: 2rem auto;
		aspect-ratio: 3 / 4;
		text-decoration: none;
		border: 1px solid var(--border-default);
		transition: transform 150ms ease, box-shadow 150ms ease;
	}

	.pinterest-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.pinterest-card-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1rem;
		padding: 2rem;
		text-align: center;
		background: linear-gradient(
			135deg,
			rgba(230, 0, 35, 0.15) 0%,
			rgba(17, 17, 16, 0.9) 50%,
			rgba(26, 25, 24, 0.95) 100%
		);
	}

	.pinterest-icon {
		color: #E60023;
	}

	.pinterest-board-name {
		font-family: var(--font-heading, 'Vollkorn Variable', serif);
		font-size: 1.375rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
		max-width: 280px;
	}

	.pinterest-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.5rem;
		border-radius: 9999px;
		background: #E60023;
		color: #ede9e3;
		font-weight: 600;
		font-size: 14px;
		transition: opacity 150ms;
		margin-top: 0.5rem;
	}

	.pinterest-card:hover .pinterest-cta {
		opacity: 0.9;
	}

	/* ── Bottom navigation ── */
	.nav-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		border-top: 1px solid var(--border-subtle);
		flex-shrink: 0;
	}

	.nav-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 1px solid var(--border-default);
		background: transparent;
		color: var(--text-primary);
		cursor: pointer;
		transition: all 150ms;
	}

	.nav-arrow:hover:not(:disabled) {
		background: var(--surface-card);
	}

	.nav-arrow:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.nav-label {
		font-size: 0.8125rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	/* ── Fallback ── */
	.fallback-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.5rem;
		border-radius: 9999px;
		background: var(--accent-primary);
		color: var(--surface-base);
		font-weight: 600;
		font-size: 14px;
		text-decoration: none;
		transition: all 150ms;
	}

	.action-btn:hover {
		opacity: 0.9;
	}
</style>
