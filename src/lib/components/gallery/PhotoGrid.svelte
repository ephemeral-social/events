<script lang="ts">
	import { onMount } from 'svelte';
	import { Image, Upload, ShieldCheck } from 'phosphor-svelte';
	import { scrollReveal } from '$lib/motion';
	import PhotoViewer from './PhotoViewer.svelte';

	interface Photo {
		photo_id: string;
		media_r2_key: string;
		uploaded_by_user_id?: string;
		media_mime_type?: string;
		created_at: string;
		exif_proof?: string;
	}

	interface Props {
		eventId: string;
		isRsvpd: boolean;
	}

	let { eventId, isRsvpd }: Props = $props();

	let photos = $state<Photo[]>([]);
	let loading = $state(false);
	let loaded = $state(false);
	let error = $state('');
	let uploading = $state(false);
	let uploadSuccess = $state(false);
	let viewerOpen = $state(false);
	let viewerIndex = $state(0);

	async function loadPhotos() {
		if (loaded || !isRsvpd) return;
		loading = true;
		error = '';

		try {
			const res = await fetch(`/api/events/${eventId}/gallery`);
			const data = (await res.json()) as { photos?: Photo[]; error?: string };
			if (!res.ok) {
				error = data.error || 'Unable to load photos';
				return;
			}
			photos = data.photos || [];
		} catch {
			error = 'Network error';
		} finally {
			loaded = true;
			loading = false;
		}
	}

	async function handleUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Validate size (15MB max)
		if (file.size > 15 * 1024 * 1024) {
			error = 'Photo must be under 15MB';
			return;
		}

		uploading = true;
		error = '';
		uploadSuccess = false;

		try {
			const formData = new FormData();
			formData.append('photo', file);

			const res = await fetch(`/api/events/${eventId}/gallery`, {
				method: 'POST',
				body: formData
			});

			const data = (await res.json()) as { error?: string };
			if (!res.ok) {
				error = data.error || 'Upload failed';
				return;
			}

			uploadSuccess = true;
			// Reload photos
			loaded = false;
			await loadPhotos();
		} catch {
			error = 'Network error';
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	// Use onMount (not $effect) to load data exactly once — $effect can loop
	// when fetch errors leave `loaded` false and Svelte re-evaluates deps.
	onMount(() => {
		if (isRsvpd) loadPhotos();
	});
</script>

{#if !isRsvpd}
	<div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4">
		<div class="flex items-center gap-2 text-[var(--text-muted)]">
			<Image size={16} weight="regular" />
			<p class="text-body-sm">RSVP to view and upload photos</p>
		</div>
	</div>
{:else}
	<div
		class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 space-y-4"
	>
		<div class="flex items-center justify-between">
			<h3 class="flex items-center gap-2 text-label-md font-medium text-[var(--text-primary)]">
				<Image size={16} weight="regular" />
				Photos
				{#if loaded}
					<span class="text-label-sm text-[var(--text-muted)]">({photos.length})</span>
				{/if}
			</h3>

			<label
				aria-label="Upload photo"
				class="flex cursor-pointer items-center gap-1.5 rounded-full bg-[var(--muted)] px-3 py-1.5 text-label-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-default)]"
			>
				<Upload size={14} weight="regular" />
				{uploading ? 'Uploading...' : 'Upload'}
				<input
					type="file"
					accept="image/jpeg,image/png,image/webp"
					class="hidden"
					onchange={handleUpload}
					disabled={uploading}
				/>
			</label>
		</div>

		{#if uploadSuccess}
			<div
				class="flex items-center gap-2 rounded-lg bg-[var(--accent-primary)]/10 px-3 py-2 text-body-sm text-[var(--accent-primary)]"
			>
				<ShieldCheck size={16} weight="duotone" />
				Photo uploaded. EXIF metadata stripped for privacy.
			</div>
		{/if}

		{#if error}
			<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
		{/if}

		{#if loading}
			<p class="text-body-sm text-[var(--text-muted)]">Loading photos...</p>
		{:else if loaded && photos.length > 0}
			<div class="grid grid-cols-3 gap-1.5">
				{#each photos as photo, index (photo.photo_id)}
					<div
						class="relative aspect-square overflow-hidden rounded-lg cursor-pointer"
						use:scrollReveal={{ y: 15, delay: index * 30 }}
						onclick={() => {
							viewerIndex = index;
							viewerOpen = true;
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								viewerIndex = index;
								viewerOpen = true;
							}
						}}
						role="button"
						tabindex="0"
					>
						<img
							src="/api/media/{photo.media_r2_key}"
							alt="Uploaded by attendee"
							class="h-full w-full object-cover"
							loading="lazy"
						/>
					</div>
				{/each}
			</div>
		{:else if loaded}
			<p class="text-body-sm text-[var(--text-muted)] py-4 text-center">
				No photos yet. Be the first to share!
			</p>
		{/if}
	</div>

	<PhotoViewer
		photos={photos.map((p) => ({ url: `/api/media/${p.media_r2_key}`, id: p.photo_id }))}
		initialIndex={viewerIndex}
		open={viewerOpen}
		onClose={() => {
			viewerOpen = false;
		}}
	/>
{/if}
