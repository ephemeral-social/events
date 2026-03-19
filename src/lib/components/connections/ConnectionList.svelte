<script lang="ts">
	import { MagnifyingGlass, UserCircle } from 'phosphor-svelte';
	import type { Connection } from '$lib/crypto/connections';

	interface Props {
		connections: Connection[];
		onselect: (connection: Connection) => void;
	}

	let { connections, onselect }: Props = $props();

	let search = $state('');

	const filtered = $derived(
		search.trim()
			? connections.filter((c) =>
					c.display_name.toLowerCase().includes(search.trim().toLowerCase())
				)
			: connections
	);

	function formatRelativeTime(unixSeconds: number): string {
		const now = Date.now() / 1000;
		const diff = now - unixSeconds;
		if (diff < 60) return 'just now';
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
		return `${Math.floor(diff / 2592000)}mo ago`;
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Search -->
	<div class="relative">
		<MagnifyingGlass
			size={18}
			weight="regular"
			class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
		/>
		<input
			type="text"
			placeholder="Search connections..."
			bind:value={search}
			class="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] py-2.5 pl-10 pr-4 text-body-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
		/>
	</div>

	<!-- List -->
	{#if filtered.length === 0}
		<div class="py-8 text-center">
			<UserCircle size={40} weight="thin" class="mx-auto mb-2 text-[var(--text-muted)]" />
			<p class="text-body-sm text-[var(--text-muted)]">
				{search ? 'No matching connections' : 'No connections yet'}
			</p>
			{#if !search}
				<p class="text-body-sm text-[var(--text-muted)] mt-1">
					Attend events to build your network
				</p>
			{/if}
		</div>
	{:else}
		<div class="flex flex-col gap-1">
			{#each filtered as connection (connection.user_id)}
				<button
					class="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150 hover:bg-[var(--surface-overlay)] active:bg-[var(--surface-overlay)] cursor-pointer"
					onclick={() => onselect(connection)}
				>
					<!-- Avatar -->
					<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-overlay)]">
						{#if connection.avatar_r2_key}
							<img
								src="/api/media/{connection.avatar_r2_key}"
								alt={connection.display_name}
								class="h-11 w-11 rounded-full object-cover"
							/>
						{:else}
							<UserCircle size={28} weight="regular" class="text-[var(--text-muted)]" />
						{/if}
					</div>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<p class="text-body-md text-[var(--text-primary)] font-medium truncate">
							{connection.display_name}
						</p>
						<p class="text-body-sm text-[var(--text-muted)]">
							{connection.shared_events} shared event{connection.shared_events !== 1 ? 's' : ''}
						</p>
					</div>

					<!-- Last seen -->
					<span class="text-body-sm text-[var(--text-muted)] shrink-0">
						{formatRelativeTime(connection.last_shared)}
					</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
