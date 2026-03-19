<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Megaphone, PaperPlaneTilt } from 'phosphor-svelte';
	import { hapticSuccess } from '$lib/utils/haptics';
	import { toastSuccess } from '$lib/stores/toast.svelte';
	import PhotoViewer from '$lib/components/gallery/PhotoViewer.svelte';

	interface Photo {
		photo_id: string;
		media_r2_key: string;
		uploaded_by_user_id?: string;
		media_mime_type?: string;
		created_at: string;
		exif_proof?: string;
	}

	interface Comment {
		id: string;
		user_id: string;
		display_name?: string;
		content: string;
		is_host_update?: boolean;
		created_at: string;
	}

	interface Props {
		eventId: string;
		isRsvpd: boolean;
	}

	let { eventId, isRsvpd }: Props = $props();

	// Photo state
	let photos = $state<Photo[]>([]);
	let photosLoading = $state(false);
	let photosLoaded = $state(false);
	let photosError = $state('');
	let uploading = $state(false);
	let viewerOpen = $state(false);
	let viewerIndex = $state(0);
	let fileInput: HTMLInputElement | undefined = $state();

	// Comment state
	let comments = $state<Comment[]>([]);
	let commentsLoading = $state(false);
	let commentsLoaded = $state(false);
	let commentsError = $state('');
	let newComment = $state('');
	let posting = $state(false);

	const sortedPhotos = $derived(
		[...photos].sort(
			(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		)
	);

	async function loadPhotos() {
		if (photosLoaded || !isRsvpd) return;
		photosLoading = true;
		photosError = '';

		try {
			const res = await fetch(`/api/events/${eventId}/gallery`);
			const data = (await res.json()) as { photos?: Photo[]; error?: string };
			if (!res.ok) {
				photosError = data.error || 'Unable to load photos';
				return;
			}
			photos = data.photos || [];
		} catch {
			photosError = 'Network error';
		} finally {
			photosLoaded = true;
			photosLoading = false;
		}
	}

	async function loadComments() {
		if (commentsLoaded || !isRsvpd) return;
		commentsLoading = true;
		commentsError = '';

		try {
			const res = await fetch(`/api/events/${eventId}/comments`);
			const data = (await res.json()) as { comments?: Comment[]; error?: string };
			if (!res.ok) {
				commentsError = data.error || 'Unable to load comments';
				return;
			}
			comments = data.comments || [];
		} catch {
			commentsError = 'Network error';
		} finally {
			commentsLoaded = true;
			commentsLoading = false;
		}
	}

	async function handleUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (file.size > 15 * 1024 * 1024) {
			photosError = 'Photo must be under 15MB';
			return;
		}

		uploading = true;
		photosError = '';

		try {
			const formData = new FormData();
			formData.append('photo', file);

			const res = await fetch(`/api/events/${eventId}/gallery`, {
				method: 'POST',
				body: formData
			});

			const data = (await res.json()) as { error?: string };
			if (!res.ok) {
				photosError = data.error || 'Upload failed';
				return;
			}

			toastSuccess('Photo uploaded');
			photosLoaded = false;
			await loadPhotos();
		} catch {
			photosError = 'Network error';
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	async function handlePost() {
		if (!newComment.trim()) return;
		posting = true;

		try {
			const res = await fetch(`/api/events/${eventId}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: newComment.trim() })
			});

			const data = (await res.json()) as Comment & { error?: string };
			if (!res.ok) {
				commentsError = data.error || 'Failed to post comment';
				return;
			}

			comments = [...comments, data];
			newComment = '';
			hapticSuccess();
		} catch {
			commentsError = 'Network error';
		} finally {
			posting = false;
		}
	}

	function formatTime(iso: string): string {
		const d = new Date(iso);
		const now = Date.now();
		const diff = now - d.getTime();
		if (diff < 60000) return 'just now';
		if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
		if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	onMount(() => {
		if (isRsvpd) {
			loadPhotos();
			loadComments();
		}
	});
</script>

{#if !isRsvpd}
	<div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4">
		<p class="text-body-sm text-[var(--text-muted)] text-center">
			RSVP to join the conversation and view photos
		</p>
	</div>
{:else}
	<div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 space-y-4">
		<!-- Photo Stories Strip -->
		<div class="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
			<!-- Upload circle -->
			<button
				class="flex shrink-0 w-14 h-14 items-center justify-center rounded-full border-2 border-dashed border-[var(--accent-primary)]/50 text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 snap-start"
				onclick={() => fileInput?.click()}
				aria-label="Upload photo"
				disabled={uploading}
			>
				{#if uploading}
					<div class="w-5 h-5 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin"></div>
				{:else}
					<Plus size={20} weight="bold" />
				{/if}
			</button>

			<!-- Photo circles -->
			{#each sortedPhotos as photo, index (photo.photo_id)}
				<button
					class="shrink-0 w-14 h-14 rounded-full overflow-hidden ring-2 ring-[var(--accent-primary)]/30 snap-start transition-transform hover:scale-105"
					onclick={() => {
						viewerIndex = index;
						viewerOpen = true;
					}}
					aria-label="View photo"
				>
					<img
						src="/api/media/{photo.media_r2_key}"
						alt=""
						class="h-full w-full object-cover"
						loading="lazy"
					/>
				</button>
			{/each}
		</div>

		<input
			bind:this={fileInput}
			type="file"
			accept="image/jpeg,image/png,image/webp"
			class="hidden"
			onchange={handleUpload}
			disabled={uploading}
		/>

		{#if photosError}
			<p class="text-body-sm text-[var(--feedback-error)]">{photosError}</p>
		{/if}

		<!-- Divider between photos and comments -->
		{#if sortedPhotos.length > 0}
			<div class="h-px bg-[var(--border-subtle)]"></div>
		{/if}

		<!-- Comments -->
		{#if commentsError}
			<p class="text-body-sm text-[var(--feedback-error)]">{commentsError}</p>
		{/if}

		{#if commentsLoading}
			<p class="text-body-sm text-[var(--text-muted)]">Loading...</p>
		{:else if commentsLoaded}
			<div class="space-y-3 max-h-80 overflow-y-auto">
				{#each comments as comment (comment.id)}
					<div
						class="space-y-1
							{comment.is_host_update ? 'border-l-2 border-[var(--accent-primary)] pl-3' : ''}"
					>
						<div class="flex items-center gap-2">
							{#if comment.is_host_update}
								<Megaphone size={14} weight="duotone" class="text-[var(--accent-primary)]" />
							{/if}
							<span class="text-label-sm font-medium text-[var(--text-primary)]">
								{comment.display_name || 'Guest'}
							</span>
							<span class="text-caption text-[var(--text-muted)]"
								>{formatTime(comment.created_at)}</span
							>
						</div>
						<p class="text-body-sm text-[var(--text-secondary)] whitespace-pre-wrap">
							{comment.content}
						</p>
					</div>
				{/each}

				{#if comments.length === 0}
					<p class="text-body-sm text-[var(--text-muted)] text-center py-2">No comments yet</p>
				{/if}
			</div>

			<!-- Comment Input -->
			<div class="flex gap-2 pt-2 border-t border-[var(--border-subtle)]">
				<input
					type="text"
					bind:value={newComment}
					placeholder="Write a comment..."
					aria-label="Write a comment"
					maxlength={500}
					class="flex h-10 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							handlePost();
						}
					}}
				/>
				<button
					aria-label="Post comment"
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-50"
					disabled={posting || !newComment.trim()}
					onclick={handlePost}
				>
					<PaperPlaneTilt size={18} weight="bold" />
				</button>
			</div>
		{/if}
	</div>

	<PhotoViewer
		photos={sortedPhotos.map((p) => ({ url: `/api/media/${p.media_r2_key}`, id: p.photo_id }))}
		initialIndex={viewerIndex}
		open={viewerOpen}
		onClose={() => {
			viewerOpen = false;
		}}
	/>
{/if}

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
