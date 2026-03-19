<script lang="ts">
	import { Megaphone } from 'phosphor-svelte';

	interface Props {
		eventId: string;
	}

	let { eventId }: Props = $props();

	let message = $state('');
	let loading = $state(false);
	let error = $state('');
	let sent = $state(false);
	let remaining = $state<number | null>(null);

	async function handleSend() {
		if (!message.trim()) return;
		if (!confirm('Send text blast to all guests?')) return;
		loading = true;
		error = '';

		try {
			const res = await fetch(`/api/events/${eventId}/text-blast`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: message.trim() })
			});

			const data = (await res.json()) as {
				remaining_blasts?: number;
				error?: string;
				code?: string;
			};

			if (!res.ok) {
				if (data.code === 'BLAST_LIMIT_REACHED') {
					error = 'You have reached the 3-blast limit for this event.';
				} else {
					error = data.error || 'Failed to send';
				}
				return;
			}

			sent = true;
			remaining = data.remaining_blasts ?? null;
			message = '';
			setTimeout(() => {
				sent = false;
			}, 3000);
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 space-y-3">
	<h3 class="flex items-center gap-2 text-label-md font-medium text-[var(--text-primary)]">
		<Megaphone size={16} weight="duotone" class="text-[var(--accent-primary)]" />
		Text Blast
	</h3>

	<p class="text-body-sm text-[var(--text-muted)]">
		Send an SMS to all RSVP'd guests. {remaining !== null
			? `${remaining} blasts remaining.`
			: '3 per event.'}
	</p>

	<label for="text-blast-message" class="sr-only">Text blast message</label>
	<textarea
		id="text-blast-message"
		bind:value={message}
		aria-label="Text blast message"
		placeholder="Write your message..."
		maxlength={300}
		rows={3}
		class="flex w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)] resize-none"
	></textarea>

	{#if error}
		<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
	{/if}

	{#if sent}
		<p class="text-body-sm text-[var(--accent-primary)]">Message sent to all guests!</p>
	{/if}

	<button
		class="w-full rounded-full bg-[var(--accent-primary)] px-4 py-2.5 text-label-md font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-50"
		disabled={loading || !message.trim()}
		onclick={handleSend}
	>
		{loading ? 'Sending...' : 'Send Text Blast'}
	</button>
</div>
