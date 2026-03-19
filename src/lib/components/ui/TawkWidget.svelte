<script lang="ts">
	import { onMount } from 'svelte';

	let { widgetId = '' }: { widgetId?: string } = $props();

	onMount(() => {
		if (!widgetId) return;

		// Set up Tawk.to API globals
		(window as any).Tawk_API = (window as any).Tawk_API || {};
		(window as any).Tawk_LoadStart = new Date();
		(window as any).Tawk_API.onBeforeLoad = function () {
			(window as any).Tawk_API.hideWidget();
		};
		(window as any).Tawk_API.onChatMinimized = function () {
			(window as any).Tawk_API.hideWidget();
		};
		(window as any).Tawk_API.onChatMaximized = function () {
			if (window.location.hash === '#max-widget') {
				history.replaceState(null, '', window.location.pathname + window.location.search);
			}
		};

		const s1 = document.createElement('script');
		s1.async = true;
		s1.src = `https://embed.tawk.to/${widgetId}`;
		s1.charset = 'UTF-8';
		s1.setAttribute('crossorigin', '*');
		document.head.appendChild(s1);
	});
</script>
