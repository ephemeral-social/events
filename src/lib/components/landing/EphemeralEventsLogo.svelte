<script lang="ts">
	let { size = 'md' }: { size?: 'sm' | 'md' | 'lg' } = $props();

	const sizes = {
		sm: { img: 'h-5', text: 'text-sm', events: 'text-xs' },
		md: { img: 'h-7', text: 'text-lg', events: 'text-sm' },
		lg: { img: 'h-9', text: 'text-xl', events: 'text-base' }
	};

	const s = $derived(sizes[size]);
</script>

<a href="/" class="group flex items-center no-underline">
	<img
		src="/landing/logo-full-white.png"
		alt="Ephemeral"
		class="{s.img} logo-themed"
	/>
</a>

<style>
	/* In light mode themes, invert the white logo so it reads as dark */
	:global([data-mode='light']) .logo-themed {
		filter: invert(1);
	}
</style>
