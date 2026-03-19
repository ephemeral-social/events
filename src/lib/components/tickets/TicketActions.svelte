<script lang="ts">
	import { CircleNotch } from 'phosphor-svelte';

	interface TicketData {
		ticket_id: string;
		status: string;
		checked_in?: boolean;
		checked_in_at?: string;
	}

	interface Props {
		ticket: TicketData;
		eventId: string;
	}

	let { ticket, eventId }: Props = $props();

	let addingWallet = $state(false);
	let walletError = $state('');

	const isIos = $derived(
		typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
	);

	async function handleAddToWallet() {
		if (addingWallet) return;
		addingWallet = true;
		walletError = '';

		try {
			const res = await fetch(
				`/api/events/${eventId}/tickets/${ticket.ticket_id}/apple-pass`
			);

			if (!res.ok) {
				try {
					const data = await res.json();
					walletError = (data as { error?: string }).error || 'Failed to generate pass';
				} catch {
					walletError = 'Failed to generate pass';
				}
				return;
			}

			const blob = await res.blob();
			const url = URL.createObjectURL(blob);

			// iOS Safari auto-opens .pkpass in Wallet preview
			const link = document.createElement('a');
			link.href = url;
			link.download = 'ticket.pkpass';
			link.click();

			// Clean up after a short delay
			setTimeout(() => URL.revokeObjectURL(url), 5000);
		} catch {
			walletError = 'Network error. Please try again.';
		} finally {
			addingWallet = false;
		}
	}
</script>

{#if ticket.status === 'active' && !ticket.checked_in && isIos}
	<div class="flex justify-center">
		<button
			type="button"
			class="relative transition-opacity duration-150 active:opacity-70 disabled:opacity-50"
			disabled={addingWallet}
			onclick={handleAddToWallet}
			aria-label="Add to Apple Wallet"
		>
			{#if addingWallet}
				<div class="absolute inset-0 flex items-center justify-center rounded-[6px] bg-black/60">
					<CircleNotch size={20} weight="bold" class="animate-spin text-white" />
				</div>
			{/if}
			<img
				src="/add-to-apple-wallet.svg"
				alt="Add to Apple Wallet"
				width="165"
				height="52"
				class="h-[52px] w-auto"
			/>
		</button>
	</div>

	{#if walletError}
		<p class="text-caption text-[var(--feedback-error)] text-center mt-1">{walletError}</p>
	{/if}
{/if}
