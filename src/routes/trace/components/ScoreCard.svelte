<script lang="ts">
	interface Props {
		score: number;
		breachCount: number;
		percentile: number;
		riskLabel: string;
		topDataClasses: string[];
	}

	let { score, breachCount, percentile, riskLabel, topDataClasses }: Props = $props();

	const circumference = 2 * Math.PI * 52;
	const offset = $derived(circumference - (score / 100) * circumference);
</script>

<div class="score-card">
	<div class="score-bar"></div>
	<div class="score-label">Surveillance Exposure Score</div>
	<svg class="score-ring" viewBox="0 0 120 120" width="120" height="120">
		<circle
			cx="60"
			cy="60"
			r="52"
			fill="none"
			stroke="rgba(255,255,255,0.04)"
			stroke-width="6"
		/>
		<circle
			cx="60"
			cy="60"
			r="52"
			fill="none"
			stroke="#DC2626"
			stroke-width="6"
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			stroke-linecap="round"
			transform="rotate(-90 60 60)"
			class="score-ring-fill"
		/>
		<text
			x="60"
			y="56"
			text-anchor="middle"
			fill="#DC2626"
			font-size="34"
			font-family="Vollkorn, Georgia, serif">{score}</text
		>
		<text
			x="60"
			y="74"
			text-anchor="middle"
			fill="#6b6560"
			font-size="10"
			font-family="Manrope, sans-serif"
			font-weight="500"
			letter-spacing="0.1em">{riskLabel}</text
		>
	</svg>
	<div class="score-summary">
		<span class="score-highlight">{breachCount} breach{breachCount !== 1 ? 'es' : ''}.</span>
		{#if topDataClasses.length > 0}
			{topDataClasses
				.join(', ')
				.replace('Phone numbers', 'Phone')
				.replace('Physical addresses', 'Address')} exposed.
		{:else}
			Your data is out there.
		{/if}
	</div>
	<div class="score-percentile">
		More exposed than <code>{percentile}%</code> of people scanned.
	</div>
	<div class="score-tags">
		{#each topDataClasses as tag}
			<span class="score-tag">{tag}</span>
		{/each}
	</div>
	<div class="score-footer">
		<div class="score-brand">
			<span class="logo-dot"></span>
			<span class="logo-text">ephemeral</span>
		</div>
		<code class="score-url">ephemeralsocial.com/trace</code>
	</div>
</div>

<style>
	.score-card {
		background: var(--surface-raised, #1a1918);
		border: 1px solid rgba(255, 255, 255, 0.06);
		padding: 36px 32px;
		max-width: 400px;
		margin: 0 auto;
		position: relative;
	}
	.score-bar {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, #dc2626, transparent);
	}
	.score-label {
		font-family: var(--font-sans);
		font-size: 10px;
		font-weight: 500;
		color: var(--text-muted, #6b6560);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		margin-bottom: 16px;
	}
	.score-ring {
		display: block;
		margin: 0 auto 20px;
	}
	.score-ring-fill {
		transition: stroke-dashoffset 1.5s ease;
	}
	.score-summary {
		font-family: var(--font-serif);
		font-size: 18px;
		color: var(--text-primary, #ede9e3);
		line-height: 1.5;
		margin-bottom: 8px;
	}
	.score-highlight {
		color: #dc2626;
	}
	.score-percentile {
		font-family: var(--font-sans);
		color: var(--text-secondary, #a39e96);
		font-size: 13px;
		margin-bottom: 20px;
	}
	.score-percentile code {
		font-family: var(--font-sans);
		font-weight: 600;
		color: #dc2626;
	}
	.score-tags {
		display: flex;
		gap: 4px;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}
	.score-tag {
		font-family: var(--font-sans);
		font-weight: 500;
		background: rgba(220, 38, 38, 0.06);
		color: #dc2626;
		font-size: 10px;
		padding: 3px 8px;
		border: 1px solid rgba(220, 38, 38, 0.15);
		letter-spacing: 0.05em;
	}
	.score-footer {
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		padding-top: 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.score-brand {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.logo-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent-primary, #52b788);
	}
	.logo-text {
		font-family: var(--font-serif);
		font-size: 15px;
		color: var(--text-secondary, #a39e96);
	}
	.score-url {
		font-family: var(--font-sans);
		font-weight: 500;
		letter-spacing: 0.02em;
		color: var(--text-muted, #6b6560);
		font-size: 10px;
	}
</style>
