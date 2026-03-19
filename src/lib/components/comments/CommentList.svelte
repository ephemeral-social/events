<script lang="ts">
	import { onMount } from 'svelte';
	import { ChatCircle, Megaphone, PaperPlaneTilt } from 'phosphor-svelte';
	import { hapticSuccess } from '$lib/utils/haptics';

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

	let comments = $state<Comment[]>([]);
	let loading = $state(false);
	let loaded = $state(false);
	let error = $state('');
	let newComment = $state('');
	let posting = $state(false);

	async function loadComments() {
		if (loaded || !isRsvpd) return;
		loading = true;
		error = '';

		try {
			const res = await fetch(`/api/events/${eventId}/comments`);
			const data = (await res.json()) as { comments?: Comment[]; error?: string };
			if (!res.ok) {
				error = data.error || 'Unable to load comments';
				return;
			}
			comments = data.comments || [];
		} catch {
			error = 'Network error';
		} finally {
			loaded = true;
			loading = false;
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
				error = data.error || 'Failed to post comment';
				return;
			}

			comments = [...comments, data];
			newComment = '';
			hapticSuccess();
		} catch {
			error = 'Network error';
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

	// Use onMount (not $effect) to load data exactly once — $effect can loop
	// when fetch errors leave `loaded` false and Svelte re-evaluates deps.
	onMount(() => {
		if (isRsvpd) loadComments();
	});
</script>

{#if !isRsvpd}
	<div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4">
		<div class="flex items-center gap-2 text-[var(--text-muted)]">
			<ChatCircle size={16} weight="regular" />
			<p class="text-body-sm">RSVP to join the conversation</p>
		</div>
	</div>
{:else}
	<div
		class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 space-y-4"
	>
		<h3 class="flex items-center gap-2 text-label-md font-medium text-[var(--text-primary)]">
			<ChatCircle size={16} weight="regular" />
			Event Wall
		</h3>

		{#if error}
			<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
		{/if}

		{#if loading}
			<p class="text-body-sm text-[var(--text-muted)]">Loading...</p>
		{:else if loaded}
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
{/if}
