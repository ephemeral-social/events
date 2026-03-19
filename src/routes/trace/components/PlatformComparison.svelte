<script lang="ts">
	import { scrollReveal } from '$lib/motion';
	import X from 'phosphor-svelte/lib/X';
	import Check from 'phosphor-svelte/lib/Check';

	const PLATFORMS = [
		{
			name: 'Partiful',
			subtitle: 'Built by Palantir alumni',
			color: '#D97706',
			bad: true,
			items: [
				'Social graph mapping — who you know, permanently',
				'Phone contacts synced on access',
				'GPS data exposed in photos (caught Oct 2025)',
				'Founded by former Palantir engineers',
				'Data retained indefinitely',
				'No public security reporting channel'
			]
		},
		{
			name: 'Eventbrite',
			subtitle: '51 trackers watching you',
			color: '#EA580C',
			bad: true,
			items: [
				'51 third-party tracking cookies active',
				'Profiles built from third-party data sources',
				'Registrations stored as orders — forever',
				'Organizers cannot delete your data',
				'Data transferable to any country on earth',
				'Organizers can embed their own trackers'
			]
		},
		{
			name: 'Ephemeral',
			subtitle: 'Deletes in 7 days',
			color: '#52b788',
			bad: false,
			items: [
				'Zero social graph. No mapping. Ever.',
				'Phone verified once, never stored',
				'EXIF metadata stripped on every upload',
				'All event data auto-deletes after 7 days',
				'Zero third-party cookies or trackers',
				'Public benefit corp — cannot be acquired'
			]
		}
	];
</script>

<div class="comparison-grid" use:scrollReveal={{ y: 15 }}>
	{#each PLATFORMS as platform}
		<div class="platform-card" style="--platform-color: {platform.color}">
			<div class="platform-bar"></div>
			<h3 class="platform-name">{platform.name}</h3>
			<p class="platform-subtitle">{platform.subtitle}</p>
			<div class="platform-items">
				{#each platform.items as item}
					<div class="platform-item">
						<span class="platform-icon">
							{#if platform.bad}
								<X size={14} weight="bold" color={platform.color} />
							{:else}
								<Check size={14} weight="bold" color={platform.color} />
							{/if}
						</span>
						<span class="platform-text" class:good={!platform.bad}>{item}</span>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.comparison-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}
	.platform-card {
		background: rgba(255, 255, 255, 0.015);
		border: 1px solid color-mix(in srgb, var(--platform-color) 13%, transparent);
		padding: 28px 20px;
		position: relative;
	}
	.platform-bar {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--platform-color);
	}
	.platform-name {
		font-family: var(--font-serif);
		font-size: 24px;
		color: var(--platform-color);
		margin: 0 0 4px;
	}
	.platform-subtitle {
		font-family: var(--font-sans);
		font-weight: 500;
		letter-spacing: 0.02em;
		font-size: 11px;
		color: var(--text-muted, #6b6560);
		margin: 0 0 20px;
	}
	.platform-items {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.platform-item {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}
	.platform-icon {
		flex-shrink: 0;
		margin-top: 2px;
		display: flex;
	}
	.platform-text {
		font-family: var(--font-sans);
		font-size: 13px;
		line-height: 1.5;
		color: #bbb;
	}
	.platform-text.good {
		color: #a7f3d0;
	}

	@media (max-width: 768px) {
		.comparison-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
