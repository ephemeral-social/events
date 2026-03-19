<script lang="ts">
	import { CircleNotch, CheckCircle, WarningCircle, ImageSquare } from 'phosphor-svelte';
	import type { CoverUploadStatus } from '$lib/stores/event-draft.svelte';

	interface Props {
		status: CoverUploadStatus;
	}

	let { status }: Props = $props();
</script>

{#if status !== 'idle'}
	<div
		class="cover-upload-overlay"
		class:uploading={status === 'uploading'}
		class:success={status === 'success'}
		class:error={status === 'error'}
		role="status"
		aria-live="polite"
	>
		<div class="upload-dialog">
			{#if status === 'uploading'}
				<div class="upload-icon-ring">
					<CircleNotch size={32} weight="bold" class="upload-spinner" />
				</div>
				<p class="upload-label">Uploading cover image</p>
				<div class="upload-progress-bar">
					<div class="upload-progress-fill"></div>
				</div>
			{:else if status === 'success'}
				<div class="upload-icon-check">
					<CheckCircle size={36} weight="fill" />
				</div>
				<p class="upload-label">Cover image uploaded</p>
			{:else if status === 'error'}
				<div class="upload-icon-error">
					<WarningCircle size={36} weight="fill" />
				</div>
				<p class="upload-label">Upload failed</p>
				<p class="upload-sublabel">Tap the camera button to try again</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.cover-upload-overlay {
		position: absolute;
		inset: 0;
		z-index: 4;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: inherit;
		transition: opacity 300ms ease, backdrop-filter 300ms ease;
	}

	.uploading {
		background: rgba(17, 17, 16, 0.75);
		backdrop-filter: blur(4px);
	}

	.success {
		background: rgba(17, 17, 16, 0.6);
		backdrop-filter: blur(2px);
		animation: overlay-fade-out 2s ease forwards;
		animation-delay: 0.8s;
	}

	.error {
		background: rgba(17, 17, 16, 0.8);
		backdrop-filter: blur(4px);
		animation: overlay-fade-out 3s ease forwards;
		animation-delay: 1.5s;
	}

	.upload-dialog {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 24px 32px;
	}

	.upload-label {
		font-family: 'Manrope Variable', 'Manrope', sans-serif;
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		color: #ede9e3;
		margin: 0;
		text-align: center;
	}

	.upload-sublabel {
		font-family: 'Manrope Variable', 'Manrope', sans-serif;
		font-size: 0.75rem;
		font-weight: 400;
		color: #a39e96;
		margin: 0;
		text-align: center;
	}

	/* Uploading spinner */
	.upload-icon-ring {
		color: #ede9e3;
	}

	.upload-icon-ring :global(.upload-spinner) {
		animation: spin 0.9s linear infinite;
	}

	/* Indeterminate progress bar */
	.upload-progress-bar {
		width: 120px;
		height: 3px;
		border-radius: 2px;
		background: rgba(237, 233, 227, 0.15);
		overflow: hidden;
	}

	.upload-progress-fill {
		height: 100%;
		width: 40%;
		border-radius: 2px;
		background: #ede9e3;
		animation: indeterminate 1.4s ease-in-out infinite;
	}

	/* Success checkmark */
	.upload-icon-check {
		color: #52b788;
		animation: check-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	/* Error icon */
	.upload-icon-error {
		color: #e85d04;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@keyframes indeterminate {
		0% { transform: translateX(-100%); }
		50% { transform: translateX(200%); }
		100% { transform: translateX(-100%); }
	}

	@keyframes check-pop {
		0% { transform: scale(0.5); opacity: 0; }
		100% { transform: scale(1); opacity: 1; }
	}

	@keyframes overlay-fade-out {
		0% { opacity: 1; }
		70% { opacity: 1; }
		100% { opacity: 0; pointer-events: none; }
	}
</style>
