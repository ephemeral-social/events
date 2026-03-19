<script lang="ts">
	import { PinterestLogo, X, Check, SignOut, SpinnerGap, ImageSquare } from 'phosphor-svelte';
	import type { PinterestBoardEntry } from '$lib/utils/inspo';

	interface Board {
		id: string;
		name: string;
		url: string;
		pin_count: number;
		cover_image: string | null;
	}

	interface Props {
		open: boolean;
		maxSelectable: number;
		onClose: () => void;
		onSelect: (boards: PinterestBoardEntry[]) => void;
	}

	let { open, maxSelectable, onClose, onSelect }: Props = $props();

	let pinterestStatus = $state<'loading' | 'not_connected' | 'connected'>('loading');
	let pinterestUsername = $state<string | null>(null);
	let boards = $state<Board[]>([]);
	let selectedIds = $state<Set<string>>(new Set());
	let loadingBoards = $state(false);
	let disconnecting = $state(false);
	let oauthError = $state<string | null>(null);

	// Fetch connection status + boards when dialog opens
	$effect(() => {
		if (open) {
			selectedIds = new Set();
			// Clean up OAuth return params from URL
			const params = new URLSearchParams(window.location.search);
			oauthError = params.get('pinterest_error');
			if (params.has('pinterest_connected') || params.has('pinterest_picker') || params.has('pinterest_error')) {
				const url = new URL(window.location.href);
				url.searchParams.delete('pinterest_connected');
				url.searchParams.delete('pinterest_picker');
				url.searchParams.delete('pinterest_error');
				window.history.replaceState({}, '', url.toString());
			}
			fetchPinterestStatus();
		}
	});

	async function fetchPinterestStatus() {
		pinterestStatus = 'loading';
		try {
			const res = await fetch('/api/pinterest/status');
			if (res.ok) {
				const data = await res.json() as { connected: boolean; pinterest_username: string | null };
				if (data.connected) {
					pinterestStatus = 'connected';
					pinterestUsername = data.pinterest_username;
					await fetchBoards();
					return;
				}
			}
		} catch {
			// fall through
		}
		pinterestStatus = 'not_connected';
	}

	async function fetchBoards() {
		loadingBoards = true;
		try {
			const res = await fetch('/api/pinterest/boards');
			if (res.ok) {
				const data = await res.json() as { boards: Board[] };
				boards = data.boards || [];
			}
		} catch {
			boards = [];
		} finally {
			loadingBoards = false;
		}
	}

	function connectPinterest() {
		// Redirect to Pinterest OAuth
		const returnTo = encodeURIComponent(window.location.pathname + '?pinterest_picker=true');
		window.location.href = `/api/pinterest/auth?return_to=${returnTo}`;
	}

	async function disconnectPinterest() {
		disconnecting = true;
		try {
			await fetch('/api/pinterest/disconnect', { method: 'POST' });
			pinterestStatus = 'not_connected';
			pinterestUsername = null;
			boards = [];
			selectedIds = new Set();
		} catch {
			// silent
		} finally {
			disconnecting = false;
		}
	}

	function toggleBoard(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else if (next.size < maxSelectable) {
			next.add(id);
		}
		selectedIds = next;
	}

	function confirmSelection() {
		const selected = boards
			.filter((b) => selectedIds.has(b.id))
			.map((b): PinterestBoardEntry => ({
				type: 'pinterest',
				board_id: b.id,
				url: b.url,
				name: b.name
			}));
		onSelect(selected);
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="picker-overlay"
		role="dialog"
		aria-modal="true"
		aria-label="Select Pinterest boards"
		tabindex="0"
		onkeydown={handleKeydown}
	>
		<div class="picker-panel">
			<!-- Header -->
			<div class="picker-header">
				<div class="picker-title-row">
					<PinterestLogo size={20} weight="fill" color="#E60023" />
					<h3 class="picker-title">Pinterest Boards</h3>
				</div>
				<button type="button" class="close-btn" onclick={onClose} aria-label="Close">
					<X size={18} weight="bold" />
				</button>
			</div>

			<!-- Content -->
			<div class="picker-content">
				{#if pinterestStatus === 'loading'}
					<div class="picker-center">
						<SpinnerGap size={28} weight="bold" class="spinner" />
						<p class="picker-text">Checking Pinterest connection...</p>
					</div>

				{:else if pinterestStatus === 'not_connected'}
					<div class="picker-center">
						<div class="connect-icon">
							<PinterestLogo size={40} weight="fill" color="#E60023" />
						</div>
						{#if oauthError}
							<p class="picker-text" style="color: #e85d04;">
								Pinterest connection failed ({oauthError}). Please try again.
							</p>
						{:else}
							<p class="picker-text">Connect your Pinterest to add boards to your event.</p>
						{/if}
						<button type="button" class="connect-btn" onclick={connectPinterest}>
							<PinterestLogo size={16} weight="fill" />
							Connect Pinterest
						</button>
					</div>

				{:else}
					<!-- Connected header -->
					<div class="connected-bar">
						<span class="connected-label">
							<PinterestLogo size={14} weight="fill" color="#E60023" />
							{pinterestUsername || 'Connected'}
						</span>
						<button
							type="button"
							class="disconnect-btn"
							onclick={disconnectPinterest}
							disabled={disconnecting}
						>
							<SignOut size={14} />
							Disconnect
						</button>
					</div>

					{#if loadingBoards}
						<div class="board-grid">
							{#each Array(6) as _}
								<div class="board-card-skeleton">
									<div class="skeleton-img"></div>
									<div class="skeleton-text"></div>
								</div>
							{/each}
						</div>
					{:else if boards.length === 0}
						<div class="picker-center">
							<ImageSquare size={32} weight="duotone" />
							<p class="picker-text">No boards found on your Pinterest account.</p>
						</div>
					{:else}
						<div class="board-grid">
							{#each boards as board}
								{@const isSelected = selectedIds.has(board.id)}
								{@const isDisabled = !isSelected && selectedIds.size >= maxSelectable}
								<button
									type="button"
									class="board-card"
									class:board-selected={isSelected}
									class:board-disabled={isDisabled}
									onclick={() => toggleBoard(board.id)}
									disabled={isDisabled}
								>
									<div class="board-cover">
										{#if board.cover_image}
											<img src={board.cover_image} alt={board.name} class="board-cover-img" />
										{:else}
											<div class="board-cover-empty">
												<ImageSquare size={24} weight="duotone" />
											</div>
										{/if}
										{#if isSelected}
											<div class="board-check">
												<Check size={16} weight="bold" />
											</div>
										{/if}
									</div>
									<div class="board-info">
										<p class="board-name">{board.name}</p>
										<p class="board-count">{board.pin_count} pins</p>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				{/if}
			</div>

			<!-- Footer with confirm button -->
			{#if pinterestStatus === 'connected' && selectedIds.size > 0}
				<div class="picker-footer">
					<button type="button" class="confirm-btn" onclick={confirmSelection}>
						Add {selectedIds.size} board{selectedIds.size > 1 ? 's' : ''}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.picker-overlay {
		position: fixed;
		inset: 0;
		z-index: 70;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.picker-panel {
		background: var(--surface-card, #1a1918);
		border-radius: 0.75rem;
		border: 1px solid var(--border-default, #2e2c2a);
		width: 100%;
		max-width: 520px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* ── Header ── */
	.picker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--border-subtle, #242220);
	}

	.picker-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.picker-title {
		font-family: var(--font-heading, 'Vollkorn Variable', serif);
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #ede9e3);
		margin: 0;
	}

	.close-btn {
		padding: 0.375rem;
		border-radius: 0.5rem;
		color: var(--text-muted, #6b6560);
		cursor: pointer;
		background: transparent;
		border: none;
		transition: all 150ms;
	}

	.close-btn:hover {
		color: var(--text-primary, #ede9e3);
		background: var(--surface-base, #111110);
	}

	/* ── Content ── */
	.picker-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.25rem;
		-webkit-overflow-scrolling: touch;
	}

	.picker-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem 1rem;
		text-align: center;
		color: var(--text-muted, #6b6560);
	}

	.picker-text {
		font-size: 0.875rem;
		color: var(--text-secondary, #a39e96);
		margin: 0;
		max-width: 280px;
	}

	.connect-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: rgba(230, 0, 35, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.connect-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.5rem;
		border-radius: 9999px;
		background: #E60023;
		color: #ede9e3;
		font-weight: 600;
		font-size: 0.875rem;
		border: none;
		cursor: pointer;
		transition: opacity 150ms;
	}

	.connect-btn:hover {
		opacity: 0.9;
	}

	/* ── Connected bar ── */
	.connected-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background: var(--surface-base, #111110);
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.connected-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: var(--text-secondary, #a39e96);
	}

	.disconnect-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		background: transparent;
		border: 1px solid var(--border-default, #2e2c2a);
		color: var(--text-muted, #6b6560);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 150ms;
	}

	.disconnect-btn:hover {
		color: var(--text-secondary, #a39e96);
		border-color: var(--text-muted, #6b6560);
	}

	/* ── Board grid ── */
	.board-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.board-card {
		background: var(--surface-base, #111110);
		border: 1px solid var(--border-default, #2e2c2a);
		border-radius: 0.75rem;
		overflow: hidden;
		cursor: pointer;
		padding: 0;
		text-align: left;
		transition: all 150ms;
	}

	.board-card:hover:not(:disabled) {
		border-color: var(--text-muted, #6b6560);
	}

	.board-selected {
		border-color: #E60023;
		box-shadow: 0 0 0 1px #E60023;
	}

	.board-disabled {
		opacity: 0.4;
		cursor: default;
	}

	.board-cover {
		position: relative;
		aspect-ratio: 4 / 3;
		background: var(--surface-card, #1a1918);
		overflow: hidden;
	}

	.board-cover-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.board-cover-empty {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted, #6b6560);
	}

	.board-check {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #E60023;
		color: #ede9e3;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.board-info {
		padding: 0.5rem 0.625rem;
	}

	.board-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary, #ede9e3);
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.board-count {
		font-size: 0.6875rem;
		color: var(--text-muted, #6b6560);
		margin: 0.125rem 0 0;
	}

	/* ── Skeleton ── */
	.board-card-skeleton {
		border-radius: 0.75rem;
		overflow: hidden;
		background: var(--surface-base, #111110);
		border: 1px solid var(--border-default, #2e2c2a);
	}

	.skeleton-img {
		aspect-ratio: 4 / 3;
		background: linear-gradient(90deg, var(--surface-card, #1a1918) 25%, var(--surface-base, #111110) 50%, var(--surface-card, #1a1918) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-text {
		height: 0.75rem;
		margin: 0.625rem;
		border-radius: 0.25rem;
		background: var(--surface-card, #1a1918);
		width: 60%;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	/* ── Footer ── */
	.picker-footer {
		padding: 0.75rem 1.25rem;
		border-top: 1px solid var(--border-subtle, #242220);
	}

	.confirm-btn {
		width: 100%;
		padding: 0.75rem;
		border-radius: 9999px;
		background: var(--accent-primary, #52b788);
		color: var(--surface-base, #111110);
		font-weight: 600;
		font-size: 0.875rem;
		border: none;
		cursor: pointer;
		transition: opacity 150ms;
	}

	.confirm-btn:hover {
		opacity: 0.9;
	}

	/* ── Spinner animation ── */
	:global(.spinner) {
		animation: spin 1s linear infinite;
		color: var(--text-muted, #6b6560);
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
