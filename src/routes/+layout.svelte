<script lang="ts">
	import '../app.css';
	import DebugPanel from '$lib/components/debug/DebugPanel.svelte';
	import { ToastContainer } from '$lib/components/ui/toast';
	import { PullToRefresh } from '$lib/components/ui/pull-to-refresh';
	import NavigationProgress from '$lib/components/ui/NavigationProgress.svelte';
	import TawkWidget from '$lib/components/ui/TawkWidget.svelte';
	import { onMount } from 'svelte';
	import { onNavigate, afterNavigate } from '$app/navigation';

	let { children, data } = $props();

	onMount(() => {
		// Enable :active pseudo-class on iOS Safari
		document.body.addEventListener('touchstart', () => {}, { passive: true });
	});

	// Scroll to top on navigation (browser can't auto-scroll our custom scroll root)
	afterNavigate(() => {
		document.getElementById('scroll-root')?.scrollTo(0, 0);
	});

	// View Transitions API — iOS-style slide animations
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		// Skip view transitions for popstate (browser back/forward, iOS swipe gesture).
		// The browser/OS already provides its own animation for these; adding a second
		// view transition on top causes a jarring double-slide.
		if (navigation.type === 'popstate') return;

		const fromDepth = navigation.from?.url.pathname.split('/').filter(Boolean).length ?? 0;
		const toDepth = navigation.to?.url.pathname.split('/').filter(Boolean).length ?? 0;
		const direction = toDepth < fromDepth ? 'back' : 'forward';
		document.documentElement.setAttribute('data-nav-direction', direction);

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<NavigationProgress />

<PullToRefresh>
	{@render children()}
</PullToRefresh>

<ToastContainer />
{#if data?.tawkWidgetId}
	<TawkWidget widgetId={data.tawkWidgetId} />
{/if}
<DebugPanel />
