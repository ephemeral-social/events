<script lang="ts">
	import { fade } from 'svelte/transition';
	import ScoreCard from './ScoreCard.svelte';
	import { generateShareImage } from '../utils';

	interface Props {
		score: number;
		breachCount: number;
		percentile: number;
		riskLabel: string;
		topDataClasses: string[];
	}

	let { score, breachCount, percentile, riskLabel, topDataClasses }: Props = $props();

	let showScore = $state(false);
	let sharing = $state(false);

	async function getBlob(): Promise<Blob> {
		return generateShareImage({ score, breachCount, percentile, riskLabel, topDataClasses });
	}

	async function shareToStories() {
		sharing = true;
		try {
			const blob = await getBlob();
			const file = new File([blob], 'exposure-score.png', { type: 'image/png' });

			if (navigator.canShare?.({ files: [file] })) {
				await navigator.share({
					files: [file],
					title: 'My Surveillance Exposure Score',
					text: 'Check yours at ephemeralsocial.com/trace'
				});
			} else {
				downloadBlob(blob);
			}
		} catch {
			// User cancelled share or error
		} finally {
			sharing = false;
		}
	}

	async function copyImage() {
		try {
			const blob = await getBlob();
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
		} catch {
			const blob = await getBlob();
			downloadBlob(blob);
		}
	}

	async function sendToFriend() {
		const blob = await getBlob();
		const file = new File([blob], 'exposure-score.png', { type: 'image/png' });

		if (navigator.canShare?.({ files: [file] })) {
			try {
				await navigator.share({
					files: [file],
					title: 'Check your surveillance exposure',
					text: 'I just checked mine at ephemeralsocial.com/trace — you should see yours.'
				});
			} catch {
				// cancelled
			}
		} else {
			downloadBlob(blob);
		}
	}

	function downloadBlob(blob: Blob) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'exposure-score.png';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="score-section">
	<div class="section-tag">Your results</div>
	{#if !showScore}
		<button class="generate-btn" onclick={() => (showScore = true)}>
			Generate my exposure score
		</button>
	{:else}
		<div transition:fade={{ duration: 400 }}>
			<ScoreCard {score} {breachCount} {percentile} {riskLabel} {topDataClasses} />
			<div class="share-buttons">
				<button class="share-btn" onclick={shareToStories} disabled={sharing}>
					{sharing ? 'Sharing...' : 'Share to Stories'}
				</button>
				<button class="share-btn" onclick={copyImage}>Copy Image</button>
				<button class="share-btn" onclick={sendToFriend}>Send to a Friend</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.score-section {
		text-align: center;
		padding: 40px 0 20px;
	}
	.section-tag {
		font-family: var(--font-sans);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--text-muted, #6b6560);
		margin-bottom: 16px;
	}
	.generate-btn {
		padding: 14px 36px;
		font-size: 14px;
		font-weight: 500;
		font-family: var(--font-sans);
		background: #dc2626;
		color: #fff;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		letter-spacing: 0.02em;
		transition: opacity 150ms ease;
	}
	.generate-btn:hover {
		opacity: 0.85;
	}
	.share-buttons {
		margin-top: 20px;
		display: flex;
		gap: 8px;
		justify-content: center;
		flex-wrap: wrap;
	}
	.share-btn {
		padding: 9px 18px;
		font-size: 12px;
		font-weight: 500;
		font-family: var(--font-sans);
		background: transparent;
		color: var(--text-secondary, #a39e96);
		border: 1px solid var(--border-default, #2e2c2a);
		border-radius: 9999px;
		cursor: pointer;
		letter-spacing: 0.03em;
		transition: all 150ms ease;
	}
	.share-btn:hover {
		color: var(--text-primary, #ede9e3);
		border-color: rgba(255, 255, 255, 0.15);
	}
	.share-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
