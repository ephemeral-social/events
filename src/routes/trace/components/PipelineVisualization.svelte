<script lang="ts">
	import { scrollReveal } from '$lib/motion';
	import { slide } from 'svelte/transition';
	import DeviceMobileCamera from 'phosphor-svelte/lib/DeviceMobileCamera';
	import Confetti from 'phosphor-svelte/lib/Confetti';
	import Eye from 'phosphor-svelte/lib/Eye';
	import Bank from 'phosphor-svelte/lib/Bank';
	import Robot from 'phosphor-svelte/lib/Robot';

	const PIPELINE_NODES = [
		{
			id: 'rsvp',
			label: 'Your RSVP',
			icon: DeviceMobileCamera,
			color: '#D97706',
			source: 'TechCrunch, Oct 2025',
			details: [
				"You enter your phone number to RSVP to a friend's birthday party on Partiful.",
				'Your contact list is synced — not just the people you invite, but your relationships mapped.',
				'Your profile photo retained GPS coordinates — your home address, extractable by anyone with browser dev tools.',
				'TechCrunch exposed this in October 2025. Partiful had no public way to report security issues.'
			]
		},
		{
			id: 'partiful',
			label: 'Partiful',
			icon: Confetti,
			color: '#D97706',
			source: 'TechCrunch, Partiful Privacy Policy',
			details: [
				'Founded by Shreya Murthy and Joy Tao — both former Palantir engineers.',
				'Built a Facebook-like social graph: who you know, who they know, where you go, all your phone numbers.',
				'Data stored indefinitely. No auto-delete. No data minimization.',
				'Google named it "Best App of 2024." Nobody asked what happens to the data.'
			]
		},
		{
			id: 'palantir',
			label: 'Palantir',
			icon: Eye,
			color: '#DC2626',
			source: 'Federal contract records, Palantir investor reports',
			details: [
				"Co-founded by Peter Thiel. Originally funded by In-Q-Tel — the CIA's venture capital arm.",
				'$2.9 billion revenue in 2024. 55% from government surveillance contracts.',
				'$10 billion Army contract — consolidating 75 contracts, access to every Army database.',
				'Built Maven: $1.3B AI warfare system. 20,000+ military users. Autonomously tracks humans.'
			]
		},
		{
			id: 'ice',
			label: 'ICE',
			icon: Bank,
			color: '#DC2626',
			source: 'American Immigration Council, Amnesty International, Federal records',
			details: [
				'$30 million contract for ImmigrationOS — AI-powered identification, tracking, and deportation.',
				'Pulls from passport records, Social Security, IRS data, license plate readers. Near real-time.',
				'Stephen Miller, architect of immigration policy, holds a financial stake in Palantir.',
				'Civil liberties groups: this system could easily be expanded to target any American.'
			]
		},
		{
			id: 'ai',
			label: 'AI + Pentagon',
			icon: Robot,
			color: '#991B1B',
			source: 'NBC News, Fast Company, Semafor, Feb 2026',
			details: [
				"Palantir deployed OpenAI's GPT-4 inside Secret and Top Secret Pentagon clouds.",
				'AI models from OpenAI, Anthropic, and Google now operate in classified military environments.',
				"Anthropic's Claude was used through Palantir during the U.S. capture of Venezuela's head of state, Jan 2026.",
				'13 former Palantir employees published an open letter warning ethical guardrails are being dismantled.'
			]
		}
	];

	let activeNode = $state<string | null>(null);

	function toggleNode(id: string) {
		activeNode = activeNode === id ? null : id;
	}

	const activeNodeData = $derived(PIPELINE_NODES.find((n) => n.id === activeNode));
</script>

<div class="pipeline" use:scrollReveal={{ y: 15 }}>
	<div class="pipeline-line"></div>
	<div class="pipeline-nodes">
		{#each PIPELINE_NODES as node}
			<button
				class="pipeline-node"
				class:active={activeNode === node.id}
				style="--node-color: {node.color}"
				onclick={() => toggleNode(node.id)}
			>
				<div class="node-circle">
					<node.icon size={28} weight="duotone" />
				</div>
				<span class="node-label">{node.label}</span>
			</button>
		{/each}
	</div>

	{#if activeNode && activeNodeData}
		<div
			class="pipeline-detail"
			style="--node-color: {activeNodeData.color}"
			transition:slide={{ duration: 250 }}
		>
			<div class="detail-header">
				<span class="detail-icon">
					<activeNodeData.icon size={22} weight="duotone" />
				</span>
				<span class="detail-name">{activeNodeData.label}</span>
			</div>
			<div class="detail-items">
				{#each activeNodeData.details as detail}
					<div class="detail-item">
						<span class="detail-bullet">&#9656;</span>
						<span>{detail}</span>
					</div>
				{/each}
			</div>
			<div class="detail-source">Sources: {activeNodeData.source}</div>
		</div>
	{/if}
</div>

<style>
	.pipeline {
		position: relative;
		padding: 16px 0 40px;
	}
	.pipeline-line {
		position: absolute;
		top: 48px;
		left: 12%;
		right: 12%;
		height: 1px;
		background: linear-gradient(
			90deg,
			rgba(217, 119, 6, 0.27),
			rgba(220, 38, 38, 0.4),
			rgba(153, 27, 27, 0.53)
		);
		z-index: 1;
	}
	.pipeline-nodes {
		display: flex;
		justify-content: space-between;
		padding: 0 2%;
		position: relative;
		z-index: 2;
	}
	.pipeline-node {
		cursor: pointer;
		text-align: center;
		background: none;
		border: none;
		padding: 0;
		color: inherit;
	}
	.node-circle {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.02);
		border: 2px solid rgba(255, 255, 255, 0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 10px;
		color: var(--text-muted, #6b6560);
		transition: all 0.3s;
	}
	.pipeline-node.active .node-circle {
		background: color-mix(in srgb, var(--node-color) 9%, transparent);
		border-color: var(--node-color);
		box-shadow: 0 0 24px color-mix(in srgb, var(--node-color) 13%, transparent);
		color: var(--node-color);
	}
	.node-label {
		font-family: var(--font-sans);
		font-size: 10px;
		font-weight: 500;
		color: var(--text-muted, #6b6560);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		transition: color 0.3s;
	}
	.pipeline-node.active .node-label {
		color: var(--node-color);
	}

	.pipeline-detail {
		margin-top: 28px;
		padding: 24px;
		background: color-mix(in srgb, var(--node-color) 3%, transparent);
		border: 1px solid color-mix(in srgb, var(--node-color) 12%, transparent);
		border-left: 3px solid var(--node-color);
	}
	.detail-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 18px;
		color: var(--node-color);
	}
	.detail-icon {
		display: flex;
	}
	.detail-name {
		font-family: var(--font-serif);
		font-size: 22px;
		color: var(--node-color);
	}
	.detail-items {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.detail-item {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		font-family: var(--font-sans);
		color: #bbb;
		font-size: 14px;
		line-height: 1.65;
	}
	.detail-bullet {
		font-family: var(--font-sans);
		color: var(--node-color);
		font-size: 10px;
		margin-top: 5px;
		flex-shrink: 0;
	}
	.detail-source {
		margin-top: 14px;
		padding-top: 10px;
		border-top: 1px solid color-mix(in srgb, var(--node-color) 7%, transparent);
		font-family: var(--font-sans);
		font-weight: 500;
		letter-spacing: 0.02em;
		font-size: 10px;
		color: var(--text-muted, #6b6560);
	}

	@media (max-width: 768px) {
		.pipeline-nodes {
			flex-wrap: wrap;
			gap: 16px;
			justify-content: center;
		}
		.pipeline-line {
			display: none;
		}
	}
</style>
