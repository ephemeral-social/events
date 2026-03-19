<script lang="ts">
	let { question, answer }: { question: string; answer: string } = $props();
	let open = $state(false);
</script>

<div
	class="overflow-hidden rounded-xl border transition-colors duration-200"
	class:border-[var(--accent-primary)]={open}
	class:border-[var(--border-default)]={!open}
	class:shadow-[0_2px_12px_rgba(82,183,136,0.06)]={open}
>
	<button
		class="flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-6 py-5 text-left font-sans text-base font-medium text-[var(--text-primary)]"
		onclick={() => (open = !open)}
	>
		<span>{question}</span>
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="var(--accent-primary)"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="shrink-0 transition-transform duration-200"
			class:rotate-180={open}
		>
			<path d="M6 9l6 6 6-6" />
		</svg>
	</button>
	<div
		class="overflow-hidden transition-all duration-300"
		class:max-h-0={!open}
		class:max-h-80={open}
	>
		<p class="px-6 pb-5 text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
			{answer}
		</p>
	</div>
</div>
