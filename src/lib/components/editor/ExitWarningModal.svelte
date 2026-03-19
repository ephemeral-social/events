<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		isDirty: boolean;
	}

	let { isDirty }: Props = $props();

	function handleBeforeUnload(e: BeforeUnloadEvent) {
		if (isDirty) {
			e.preventDefault();
		}
	}

	onMount(() => {
		if (isDirty) {
			window.addEventListener('beforeunload', handleBeforeUnload);
		}
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});
</script>

<div data-testid="exit-warning" class="exit-warning"></div>
