<script lang="ts">
	import { ShieldCheck, Camera, TrashSimple } from 'phosphor-svelte';
	import type { PrivacyStats } from '$lib/utils/event-helpers';
	import { formatCountdown } from '$lib/utils/date-format';

	interface Props {
		stats: PrivacyStats;
	}

	let { stats }: Props = $props();

	const countdown = $derived(
		stats.deletion_scheduled ? formatCountdown(stats.deletion_scheduled) : null
	);
</script>

<div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 space-y-3">
	<div class="flex items-center gap-2 text-[var(--accent-primary)]">
		<ShieldCheck size={18} weight="duotone" />
		<span class="text-label-sm font-medium">Privacy Dashboard</span>
	</div>

	<div class="grid grid-cols-2 gap-3 text-body-sm">
		<div class="space-y-0.5">
			<p class="text-[var(--text-muted)]">Photos</p>
			<div class="flex items-center gap-1.5 text-[var(--text-secondary)]">
				<Camera size={14} weight="regular" />
				<span>{stats.photo_count} {stats.photo_count === 1 ? 'photo' : 'photos'} uploaded</span>
			</div>
		</div>

		<div class="space-y-0.5">
			<p class="text-[var(--text-muted)]">Metadata</p>
			<p class="text-[var(--text-secondary)]">
				{stats.metadata_stripped ? 'EXIF stripped' : 'Processing'}
			</p>
		</div>

		<div class="space-y-0.5">
			<p class="text-[var(--text-muted)]">Data sharing</p>
			<p class="text-[var(--text-secondary)] capitalize">{stats.data_sharing}</p>
		</div>

		{#if countdown}
			<div class="space-y-0.5">
				<p class="text-[var(--text-muted)]">Auto-delete</p>
				<div
					class="flex items-center gap-1.5 {countdown.urgent
						? 'text-[var(--feedback-warning)]'
						: 'text-[var(--text-secondary)]'}"
				>
					<TrashSimple size={14} weight="regular" />
					<span>{countdown.text}</span>
				</div>
			</div>
		{/if}
	</div>
</div>
