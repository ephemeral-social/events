<script lang="ts">
	import { getToasts } from '$lib/stores/toast.svelte';
	import Toast from './Toast.svelte';

	const toasts = $derived(getToasts());
</script>

{#if toasts.length > 0}
	<div
		class="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col items-center gap-2 px-4 pointer-events-none"
		style="padding-bottom: max(var(--safe-bottom, 0px), 12px)"
	>
		{#each toasts as toast (toast.id)}
			<div class="w-full max-w-md pointer-events-auto">
				<Toast {...toast} />
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes toast-slide-up {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	:global(.toast-exit) {
		animation: toast-fade-out 200ms ease-out forwards;
	}

	@keyframes toast-fade-out {
		to {
			opacity: 0;
			transform: translateY(10px);
		}
	}
</style>
