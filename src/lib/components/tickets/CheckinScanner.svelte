<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Camera,
		CheckCircle,
		XCircle,
		Warning,
		MagnifyingGlass,
		VideoCameraSlash
	} from 'phosphor-svelte';
	import CheckinGuestRow from './CheckinGuestRow.svelte';

	interface Props {
		eventId: string;
		eventTitle?: string;
	}

	let { eventId }: Props = $props();

	interface TicketGuest {
		ticket_id: string;
		display_name?: string;
		username?: string;
		status: string;
		checked_in?: boolean;
		checked_in_at?: string;
		ticket_number?: number;
	}

	let guests = $state<TicketGuest[]>([]);
	let scanner: import('html5-qrcode').Html5Qrcode | null = $state(null);
	let scannerReady = $state(false);
	let scannerError = $state('');
	let manualCode = $state('');
	let searchQuery = $state('');
	let checkingId = $state<string | null>(null);
	let result = $state<{
		status: 'success' | 'error' | 'warning';
		message: string;
	} | null>(null);
	let resultTimeout: ReturnType<typeof setTimeout> | undefined;
	let pollInterval: ReturnType<typeof setInterval> | undefined;
	let loadingGuests = $state(true);

	// Cooldown: ignore re-scans of the same code for a period
	const SCAN_COOLDOWN_MS = 3_000;
	const recentScans = new Map<string, number>();
	let scannerPaused = $state(false);
	let pauseTimer: ReturnType<typeof setTimeout> | undefined;

	function isOnCooldown(code: string): boolean {
		const lastScan = recentScans.get(code);
		if (!lastScan) return false;
		return Date.now() - lastScan < SCAN_COOLDOWN_MS;
	}

	function markScanned(code: string) {
		recentScans.set(code, Date.now());
		// Visual pause: overlay on camera feed
		scannerPaused = true;
		if (pauseTimer) clearTimeout(pauseTimer);
		pauseTimer = setTimeout(() => {
			scannerPaused = false;
		}, SCAN_COOLDOWN_MS);
	}

	const totalGuests = $derived(guests.filter((g) => g.status !== 'refunded').length);
	const checkedInCount = $derived(
		guests.filter((g) => g.checked_in || g.status === 'used').length
	);

	const filteredGuests = $derived.by(() => {
		if (!searchQuery.trim()) return guests;
		const q = searchQuery.toLowerCase();
		return guests.filter(
			(g) =>
				(g.display_name && g.display_name.toLowerCase().includes(q)) ||
				(g.username && g.username.toLowerCase().includes(q)) ||
				g.ticket_id.toLowerCase().includes(q)
		);
	});

	async function fetchGuests() {
		try {
			const res = await fetch(`/api/events/${eventId}/tickets/all`);
			if (res.ok) {
				const data = (await res.json()) as { tickets?: TicketGuest[] };
				if (data.tickets) {
					guests = data.tickets;
				}
			}
		} catch {
			// Silently retry on next poll
		} finally {
			loadingGuests = false;
		}
	}

	async function checkIn(ticketId: string) {
		if (checkingId) return;
		checkingId = ticketId;
		clearResultTimeout();

		try {
			const res = await fetch(`/api/events/${eventId}/check-in`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ticket_id: ticketId })
			});

			const data = (await res.json()) as {
				status?: string;
				message?: string;
				error?: string;
			};

			if (data.status === 'checked_in') {
				result = { status: 'success', message: data.message || 'Checked in!' };
				// Update local state
				guests = guests.map((g) =>
					g.ticket_id === ticketId
						? { ...g, checked_in: true, checked_in_at: new Date().toISOString() }
						: g
				);
				vibrate();
			} else if (data.status === 'already_checked_in') {
				result = {
					status: 'warning',
					message: data.message || 'Already checked in'
				};
			} else {
				result = {
					status: 'error',
					message: data.error || data.message || 'Invalid ticket'
				};
			}
		} catch {
			result = { status: 'error', message: 'Network error' };
		} finally {
			checkingId = null;
			resultTimeout = setTimeout(() => {
				result = null;
			}, 4000);
		}
	}

	function clearResultTimeout() {
		if (resultTimeout) {
			clearTimeout(resultTimeout);
			resultTimeout = undefined;
		}
	}

	function vibrate() {
		try {
			if (navigator.vibrate) navigator.vibrate(200);
		} catch {
			// Not supported
		}
	}

	function handleManualSubmit() {
		const code = manualCode.trim();
		if (code) {
			checkIn(code);
			manualCode = '';
		}
	}

	async function initScanner() {
		try {
			const { Html5Qrcode } = await import('html5-qrcode');
			const qr = new Html5Qrcode('qr-reader');
			scanner = qr;

			await qr.start(
				{ facingMode: 'environment' },
				{ fps: 10, qrbox: { width: 250, height: 250 } },
				(decodedText: string) => {
					if (checkingId) return;
					if (isOnCooldown(decodedText)) return;
					markScanned(decodedText);
					checkIn(decodedText);
				},
				() => {
					// Ignore scan failures (no QR in frame)
				}
			);
			scannerReady = true;
		} catch (err) {
			scannerError =
				err instanceof Error ? err.message : 'Could not access camera';
		}
	}

	onMount(() => {
		fetchGuests();
		initScanner();

		// Poll guest list every 10 seconds
		pollInterval = setInterval(fetchGuests, 10_000);

		return () => {
			if (pollInterval) clearInterval(pollInterval);
			if (pauseTimer) clearTimeout(pauseTimer);
			clearResultTimeout();
			recentScans.clear();
			if (scanner) {
				try {
					scanner.stop();
				} catch {
					// Already stopped
				}
			}
		};
	});
</script>

<div class="space-y-5">
	<!-- Summary bar -->
	<div class="flex items-center justify-center gap-2 text-body-md text-[var(--text-secondary)]">
		<CheckCircle size={18} weight="regular" class="text-[var(--accent-primary)]" />
		<span>
			<span class="font-bold text-[var(--text-primary)]">{checkedInCount}</span>
			of
			<span class="font-bold text-[var(--text-primary)]">{totalGuests}</span>
			checked in
		</span>
	</div>

	<!-- Result Banner -->
	{#if result}
		<div
			class="flex items-center gap-3 rounded-xl p-4 transition-all duration-200
				{result.status === 'success'
				? 'bg-[var(--accent-primary)]/15'
				: result.status === 'warning'
					? 'bg-[var(--feedback-warning)]/15'
					: 'bg-[var(--feedback-error)]/15'}"
		>
			{#if result.status === 'success'}
				<CheckCircle size={24} weight="bold" class="text-[var(--accent-primary)]" />
			{:else if result.status === 'warning'}
				<Warning size={24} weight="bold" class="text-[var(--feedback-warning)]" />
			{:else}
				<XCircle size={24} weight="bold" class="text-[var(--feedback-error)]" />
			{/if}
			<span class="text-body-md font-medium text-[var(--text-primary)]">{result.message}</span>
		</div>
	{/if}

	<!-- QR Camera Feed -->
	<div class="relative overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
		<div id="qr-reader" class="w-full"></div>
		{#if scannerError}
			<div class="flex flex-col items-center gap-3 p-8 text-center">
				<VideoCameraSlash size={48} weight="thin" class="text-[var(--text-muted)]" />
				<p class="text-body-sm text-[var(--text-muted)]">{scannerError}</p>
				<p class="text-caption text-[var(--text-muted)]">Use manual entry below as fallback.</p>
			</div>
		{:else if !scannerReady}
			<div class="flex flex-col items-center gap-3 p-8 text-center">
				<Camera size={48} weight="thin" class="text-[var(--text-muted)]" />
				<p class="text-body-sm text-[var(--text-muted)]">Starting camera...</p>
			</div>
		{/if}

		<!-- Cooldown overlay: dims camera and shows countdown ring -->
		{#if scannerPaused && scannerReady}
			<div class="scanner-overlay">
				<div class="scanner-overlay-ring">
					<svg viewBox="0 0 48 48" class="h-12 w-12">
						<circle cx="24" cy="24" r="20" fill="none" stroke-width="3"
							class="stroke-[var(--text-muted)]/20" />
						<circle cx="24" cy="24" r="20" fill="none" stroke-width="3"
							stroke-linecap="round"
							class="scanner-countdown-ring"
							style="--cooldown: {SCAN_COOLDOWN_MS}ms"
						/>
					</svg>
				</div>
				<span class="text-label-sm text-[var(--text-secondary)]">Scan paused</span>
			</div>
		{/if}
	</div>

	<!-- Manual Entry -->
	<div class="space-y-2">
		<label for="manual-ticket" class="text-label-sm text-[var(--text-muted)]"
			>Manual ticket ID</label
		>
		<div class="flex gap-2">
			<input
				id="manual-ticket"
				type="text"
				bind:value={manualCode}
				placeholder="Enter ticket ID"
				class="flex h-10 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
				onkeydown={(e) => {
					if (e.key === 'Enter') handleManualSubmit();
				}}
			/>
			<button
				class="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-label-md font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-50"
				disabled={!!checkingId || !manualCode.trim()}
				onclick={handleManualSubmit}
			>
				{checkingId ? '...' : 'Check In'}
			</button>
		</div>
	</div>

	<!-- Search + Guest List -->
	<div class="space-y-3">
		<div class="relative">
			<MagnifyingGlass
				size={16}
				weight="regular"
				class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search guests..."
				class="flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] pl-9 pr-3 py-2 text-body-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
			/>
		</div>

		{#if loadingGuests}
			<p class="text-body-sm text-[var(--text-muted)] text-center py-4">Loading guest list...</p>
		{:else if filteredGuests.length === 0}
			<p class="text-body-sm text-[var(--text-muted)] text-center py-4">
				{searchQuery.trim() ? 'No matching guests found.' : 'No tickets found for this event.'}
			</p>
		{:else}
			<div class="space-y-2">
				{#each filteredGuests as ticket (ticket.ticket_id)}
					<CheckinGuestRow
						{ticket}
						onCheckIn={checkIn}
						checking={checkingId === ticket.ticket_id}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Override html5-qrcode default styling to fit dark theme */
	:global(#qr-reader) {
		border: none !important;
	}
	:global(#qr-reader video) {
		border-radius: 0.75rem;
	}
	:global(#qr-reader__scan_region) {
		min-height: 200px;
	}
	:global(#qr-reader__dashboard) {
		display: none !important;
	}

	/* Cooldown overlay */
	.scanner-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: var(--backdrop-overlay);
		border-radius: 0.75rem;
		z-index: 10;
		pointer-events: none;
	}

	.scanner-overlay-ring {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Animated countdown ring — shrinks over the cooldown duration */
	.scanner-countdown-ring {
		stroke: var(--accent-primary);
		/* circumference = 2 * π * 20 ≈ 125.66 */
		stroke-dasharray: 125.66;
		stroke-dashoffset: 0;
		transform: rotate(-90deg);
		transform-origin: center;
		animation: countdown-sweep var(--cooldown) linear forwards;
	}

	@keyframes countdown-sweep {
		from {
			stroke-dashoffset: 0;
		}
		to {
			stroke-dashoffset: 125.66;
		}
	}
</style>
