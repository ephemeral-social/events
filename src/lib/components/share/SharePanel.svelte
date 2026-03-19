<script lang="ts">
	import { Copy, Check, QrCode, ShareNetwork } from 'phosphor-svelte';
	import { getShareUrl, type PublicEvent } from '$lib/utils/event-helpers';
	import QrCodeDisplay from './QrCodeDisplay.svelte';
	import { hapticLight, hapticSuccess } from '$lib/utils/haptics';
	import { toastSuccess } from '$lib/stores/toast.svelte';

	interface Props {
		slug: string;
		shortCode?: string;
		eventId: string;
		event?: PublicEvent;
	}

	let { slug, shortCode, eventId, event }: Props = $props();

	let copied = $state(false);
	let showQr = $state(false);
	const shareUrl = $derived(getShareUrl(slug, shortCode));

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			hapticSuccess();
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// Fallback for older browsers
			const input = document.createElement('input');
			input.value = shareUrl;
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}

	async function nativeShare() {
		hapticLight();
		const shareData: ShareData = {
			title: event?.title ?? 'Event',
			url: shareUrl
		};

		try {
			if (navigator.share) {
				await navigator.share(shareData);
			} else {
				// Fallback: copy link
				await copyLink();
				toastSuccess('Link copied');
			}
		} catch (err) {
			// User cancelled share — not an error
			if (err instanceof Error && err.name !== 'AbortError') {
				await copyLink();
				toastSuccess('Link copied');
			}
		}
	}
</script>

<div class="space-y-3">
	<!-- Show QR Code -->
	<button
		onclick={() => { hapticLight(); showQr = !showQr; }}
		class="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--muted)] px-4 py-2.5 text-label-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--border-default)]"
		aria-expanded={showQr}
	>
		<QrCode size={16} weight="regular" />
		{showQr ? 'Hide QR Code' : 'Show QR Code'}
	</button>

	{#if showQr}
		<QrCodeDisplay url={shareUrl} eventTitle={event?.title} />
	{/if}

	<!-- Share to... (native share sheet) -->
	<button
		onclick={nativeShare}
		class="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-primary)] px-4 py-2.5 text-label-sm font-semibold text-[var(--surface-base)] transition-colors hover:bg-[var(--accent-hover)]"
	>
		<ShareNetwork size={16} weight="bold" />
		Share to...
	</button>

	<!-- Copy Link -->
	<button
		aria-label="Copy event link"
		class="flex w-full items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2.5 text-left transition-colors hover:border-[var(--border-default)]"
		onclick={copyLink}
	>
		<span class="text-body-sm text-[var(--text-secondary)] truncate pr-2">{shareUrl}</span>
		{#if copied}
			<Check size={18} weight="bold" class="shrink-0 text-[var(--accent-primary)]" />
		{:else}
			<Copy size={18} weight="regular" class="shrink-0 text-[var(--text-muted)]" />
		{/if}
	</button>
</div>
