<script lang="ts">
	import { scrollReveal } from '$lib/motion';
	import type { Breach } from '../types';
	import { generateContext } from '../utils';

	interface Props {
		breach: Breach;
		index: number;
	}

	let { breach, index }: Props = $props();

	const year = $derived(breach.date.split('-')[0]);
	const recordCount = $derived(formatCount(breach.count));
	const context = $derived(generateContext(breach));

	function formatCount(n: number): string {
		if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
		return String(n);
	}
</script>

<div class="breach-card" use:scrollReveal={{ y: 16, delay: index * 80 }}>
	<div class="breach-header">
		<div class="breach-name-row">
			<span class="breach-name">{breach.title}</span>
			<code class="breach-date">{year}</code>
		</div>
		<code class="breach-records">{recordCount} RECORDS</code>
	</div>
	<div class="breach-tags">
		{#each breach.dataClasses as type}
			<span class="breach-tag">{type}</span>
		{/each}
	</div>
	<p class="breach-context">{context}</p>
</div>

<style>
	.breach-card {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(220, 38, 38, 0.12);
		border-left: 3px solid rgba(220, 38, 38, 0.4);
		padding: 20px 24px;
		margin-bottom: 8px;
	}
	.breach-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 10px;
	}
	.breach-name-row {
		display: flex;
		align-items: baseline;
		gap: 12px;
	}
	.breach-name {
		font-family: var(--font-serif);
		font-size: 20px;
		color: var(--text-primary, #ede9e3);
	}
	.breach-date {
		font-family: var(--font-sans);
		font-weight: 500;
		letter-spacing: 0.05em;
		font-size: 12px;
		color: var(--text-muted, #6b6560);
	}
	.breach-records {
		font-family: var(--font-sans);
		font-weight: 500;
		letter-spacing: 0.05em;
		font-size: 11px;
		color: #dc2626;
	}
	.breach-tags {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-bottom: 12px;
	}
	.breach-tag {
		font-family: var(--font-sans);
		font-weight: 500;
		letter-spacing: 0.02em;
		background: rgba(220, 38, 38, 0.08);
		color: #f87171;
		font-size: 11px;
		padding: 2px 8px;
		border: 1px solid rgba(220, 38, 38, 0.15);
	}
	.breach-context {
		font-family: var(--font-sans);
		color: var(--text-secondary, #a39e96);
		font-size: 13px;
		line-height: 1.65;
		margin: 0;
	}

	@media (max-width: 768px) {
		.breach-header {
			flex-direction: column;
			gap: 4px;
		}
	}
</style>
