<script lang="ts">
	import { onMount } from 'svelte';
	import {
		QrCode,
		Copy,
		Trash,
		Plus,
		SpinnerGap,
		CheckCircle,
		Clock
	} from 'phosphor-svelte';

	interface Props {
		eventId: string;
		slug: string;
	}

	let { eventId, slug }: Props = $props();

	interface CheckinToken {
		token: string;
		label?: string;
		expires_at: string;
		created_at: string;
	}

	let tokens = $state<CheckinToken[]>([]);
	let loading = $state(true);
	let generating = $state(false);
	let label = $state('');
	let error = $state('');
	let copied = $state<string | null>(null);
	let copiedTimeout: ReturnType<typeof setTimeout> | undefined;

	function getCheckinUrl(token: string): string {
		return `https://ephemeralsocial.com/e/${slug}/check-in?token=${token}`;
	}

	function formatExpiry(expiresAt: string): string {
		const diff = new Date(expiresAt).getTime() - Date.now();
		if (diff <= 0) return 'Expired';
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		if (hours > 24) {
			const days = Math.floor(hours / 24);
			return `${days}d ${hours % 24}h remaining`;
		}
		if (hours > 0) return `${hours}h ${minutes}m remaining`;
		return `${minutes}m remaining`;
	}

	async function fetchTokens() {
		try {
			const res = await fetch(`/api/events/${eventId}/checkin-tokens`);
			if (res.ok) {
				const data = (await res.json()) as { tokens?: CheckinToken[] };
				tokens = data.tokens || [];
			}
		} catch {
			// Ignore fetch errors
		} finally {
			loading = false;
		}
	}

	async function generateToken() {
		generating = true;
		error = '';

		try {
			const res = await fetch(`/api/events/${eventId}/checkin-tokens`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ label: label.trim() || undefined })
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				error = data.error || 'Failed to generate link';
				return;
			}

			label = '';
			await fetchTokens();
		} catch {
			error = 'Network error';
		} finally {
			generating = false;
		}
	}

	async function copyUrl(token: string) {
		const url = getCheckinUrl(token);
		try {
			await navigator.clipboard.writeText(url);
			if (copiedTimeout) clearTimeout(copiedTimeout);
			copied = token;
			copiedTimeout = setTimeout(() => {
				copied = null;
			}, 2000);
		} catch {
			// Fallback: select text in a temporary input
			const input = document.createElement('input');
			input.value = url;
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
			copied = token;
			copiedTimeout = setTimeout(() => {
				copied = null;
			}, 2000);
		}
	}

	async function revokeToken(token: string) {
		if (!confirm('Revoke this check-in link? Anyone using it will lose access.')) return;

		try {
			const res = await fetch(`/api/events/${eventId}/checkin-tokens`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token_id: token })
			});

			if (res.ok) {
				tokens = tokens.filter((t) => t.token !== token);
			}
		} catch {
			// Ignore
		}
	}

	onMount(() => {
		fetchTokens();
		return () => {
			if (copiedTimeout) clearTimeout(copiedTimeout);
		};
	});
</script>

<div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 space-y-3">
	<h3 class="flex items-center gap-2 text-label-md font-medium text-[var(--text-primary)]">
		<QrCode size={16} weight="duotone" class="text-[var(--accent-primary)]" />
		Check-In Links
	</h3>

	<p class="text-body-sm text-[var(--text-muted)]">
		Generate shareable links for door staff to check in guests without an account.
	</p>

	{#if loading}
		<div class="flex justify-center py-4">
			<SpinnerGap size={20} weight="bold" class="animate-spin text-[var(--text-muted)]" />
		</div>
	{:else}
		<!-- Active tokens -->
		{#if tokens.length > 0}
			<div class="space-y-2">
				{#each tokens as t (t.token)}
					<div class="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)] px-3 py-2.5">
						<div class="min-w-0 flex-1">
							<p class="truncate text-body-sm font-medium text-[var(--text-primary)]">
								{t.label || 'Check-in link'}
							</p>
							<p class="flex items-center gap-1 text-caption text-[var(--text-muted)]">
								<Clock size={12} weight="regular" />
								{formatExpiry(t.expires_at)}
							</p>
						</div>
						<button
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-overlay)]"
							onclick={() => copyUrl(t.token)}
							aria-label="Copy link"
						>
							{#if copied === t.token}
								<CheckCircle size={16} weight="bold" class="text-[var(--accent-primary)]" />
							{:else}
								<Copy size={16} weight="regular" class="text-[var(--text-secondary)]" />
							{/if}
						</button>
						<button
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--feedback-error)]/10"
							onclick={() => revokeToken(t.token)}
							aria-label="Revoke link"
						>
							<Trash size={16} weight="regular" class="text-[var(--feedback-error)]" />
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Generate new -->
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={label}
				placeholder="Label (e.g. Door Staff)"
				class="flex h-10 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
				onkeydown={(e) => {
					if (e.key === 'Enter') generateToken();
				}}
			/>
			<button
				class="flex h-10 items-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-4 text-label-md font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-50"
				disabled={generating}
				onclick={generateToken}
			>
				{#if generating}
					<SpinnerGap size={16} weight="bold" class="animate-spin" />
				{:else}
					<Plus size={16} weight="bold" />
				{/if}
				Generate
			</button>
		</div>

		{#if error}
			<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
		{/if}
	{/if}
</div>
