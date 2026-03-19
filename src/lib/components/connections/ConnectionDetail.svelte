<script lang="ts">
	import { UserCircle, CalendarBlank, Clock, Trash } from 'phosphor-svelte';
	import { Button } from '$lib/components/ui/button';
	import BottomSheet from '$lib/components/ui/bottom-sheet/BottomSheet.svelte';
	import type { Connection } from '$lib/crypto/connections';
	import { removeConnection } from '$lib/stores/connections.svelte';

	interface Props {
		connection: Connection | null;
		open: boolean;
		onClose: () => void;
	}

	let { connection, open, onClose }: Props = $props();

	let showConfirm = $state(false);
	let removing = $state(false);

	// Reset confirm state when connection changes
	$effect(() => {
		if (connection) {
			showConfirm = false;
			removing = false;
		}
	});

	async function handleRemove() {
		if (!connection) return;
		removing = true;
		await removeConnection(connection.user_id);
		removing = false;
		onClose();
	}

	function formatDate(unixSeconds: number): string {
		return new Date(unixSeconds * 1000).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<BottomSheet {open} {onClose}>
	{#if connection}
		<div class="flex flex-col items-center gap-4 pb-4">
			<!-- Avatar -->
			<div class="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-card)]">
				{#if connection.avatar_r2_key}
					<img
						src="/api/media/{connection.avatar_r2_key}"
						alt={connection.display_name}
						class="h-20 w-20 rounded-full object-cover"
					/>
				{:else}
					<UserCircle size={48} weight="regular" class="text-[var(--text-muted)]" />
				{/if}
			</div>

			<!-- Name -->
			<div class="text-center">
				<h3 class="text-headline-sm text-[var(--text-primary)]">
					{connection.display_name}
				</h3>
				{#if connection.first_name}
					<p class="text-body-sm text-[var(--text-muted)]">
						{connection.first_name}{connection.last_name ? ` ${connection.last_name}` : ''}
					</p>
				{/if}
			</div>

			<!-- Stats -->
			<div class="flex gap-6 py-3">
				<div class="flex items-center gap-2">
					<CalendarBlank size={18} weight="regular" class="text-[var(--accent-primary)]" />
					<div>
						<p class="text-body-md text-[var(--text-primary)] font-medium">
							{connection.shared_events}
						</p>
						<p class="text-body-sm text-[var(--text-muted)]">
							shared event{connection.shared_events !== 1 ? 's' : ''}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<Clock size={18} weight="regular" class="text-[var(--accent-primary)]" />
					<div>
						<p class="text-body-md text-[var(--text-primary)] font-medium">
							{formatDate(connection.first_shared)}
						</p>
						<p class="text-body-sm text-[var(--text-muted)]">first met</p>
					</div>
				</div>
			</div>

			<!-- Last shared -->
			<p class="text-body-sm text-[var(--text-muted)]">
				Last shared event: {formatDate(connection.last_shared)}
			</p>

			<!-- Remove -->
			<div class="w-full border-t border-[var(--border-subtle)] pt-4 mt-2">
				{#if !showConfirm}
					<button
						class="flex items-center gap-2 mx-auto text-body-sm text-[var(--text-muted)] hover:text-[var(--feedback-error)] transition-colors cursor-pointer"
						onclick={() => (showConfirm = true)}
					>
						<Trash size={16} weight="regular" />
						Remove connection
					</button>
				{:else}
					<div class="flex flex-col items-center gap-3">
						<p class="text-body-sm text-[var(--feedback-error)]">
							Remove {connection.display_name} from your connections?
						</p>
						<div class="flex gap-3">
							<Button
								variant="ghost"
								size="sm"
								onclick={() => (showConfirm = false)}
								disabled={removing}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onclick={handleRemove}
								disabled={removing}
							>
								{removing ? 'Removing...' : 'Remove'}
							</Button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</BottomSheet>
