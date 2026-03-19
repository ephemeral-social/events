<script lang="ts">
	interface Props {
		text: string;
		class?: string;
		maxLines?: number;
	}

	let { text, class: className = '', maxLines = 4 }: Props = $props();

	let expanded = $state(false);
	let descEl: HTMLSpanElement | undefined = $state();

	function toggle() {
		expanded = !expanded;
		if (expanded) {
			// Wait for layout update, then scroll to show full text
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					descEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
				});
			});
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<span
	bind:this={descEl}
	class="expandable-description {className}"
	class:clamped={!expanded}
	style:--max-lines={maxLines}
	onclick={toggle}
	onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
	role="button"
	tabindex="0"
	data-testid="expandable-description"
	data-expanded={expanded}
>
	{text}
</span>

<style>
	.expandable-description {
		white-space: pre-wrap;
		cursor: pointer;
		transition: max-height 300ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.clamped {
		display: -webkit-box;
		-webkit-line-clamp: var(--max-lines, 4);
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
