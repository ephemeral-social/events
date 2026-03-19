<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		borderRadius?: string;
		class?: string;
	}

	let {
		width = '100%',
		height = '1rem',
		borderRadius = '0.375rem',
		class: className
	}: Props = $props();
</script>

<div
	class={`shimmer-loader${className ? ` ${className}` : ''}`}
	role="status"
	aria-label="Loading"
	style:width
	style:height
	style:border-radius={borderRadius}
></div>

<style>
	.shimmer-loader {
		background: linear-gradient(
			90deg,
			var(--surface-raised) 0%,
			var(--surface-overlay) 50%,
			var(--surface-raised) 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shimmer-loader {
			animation: none;
			background: var(--surface-overlay);
		}
	}
</style>
