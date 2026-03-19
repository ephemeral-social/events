<script lang="ts">
	interface Props {
		previewUrl: string | null;
		isVideo?: boolean;
		onUpload: (file: File) => void;
	}

	let { previewUrl, isVideo = false, onUpload }: Props = $props();
	let fileInput: HTMLInputElement | undefined = $state();
	let isDragOver = $state(false);

	function isMediaFile(file: File): boolean {
		return file.type.startsWith('image/') || file.type.startsWith('video/');
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		const file = e.dataTransfer?.files[0];
		if (file && isMediaFile(file)) {
			onUpload(file);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			onUpload(file);
		}
	}

	function openFilePicker() {
		fileInput?.click();
	}
</script>

<div
	class="cover-uploader"
	class:drag-over={isDragOver}
	class:has-preview={!!previewUrl}
	data-testid="cover-uploader"
	role="button"
	tabindex="0"
	ondrop={handleDrop}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	onclick={openFilePicker}
	onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') openFilePicker(); }}
>
	{#if previewUrl}
		{#if isVideo}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video src={previewUrl} class="cover-preview" muted loop autoplay playsinline></video>
		{:else}
			<img src={previewUrl} alt="Cover preview" class="cover-preview" />
		{/if}
		<div class="cover-overlay">
			<span>Change cover</span>
		</div>
	{:else}
		<div class="drop-zone">
			<span>Drop image or video, or click to upload</span>
		</div>
	{/if}
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*,video/*"
		class="hidden-input"
		onchange={handleFileSelect}
	/>
</div>

<style>
	.cover-uploader {
		position: relative;
		width: 100%;
		min-height: 200px;
		border-radius: 0.75rem;
		overflow: hidden;
		cursor: pointer;
	}

	.drop-zone {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 200px;
		border: 2px dashed #2e2c2a;
		border-radius: 0.75rem;
		color: #6b6560;
		transition: border-color 150ms ease;
	}

	.drag-over .drop-zone {
		border-color: #52b788;
	}

	.cover-preview {
		width: 100%;
		height: auto;
		display: block;
		object-fit: cover;
	}

	.cover-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.5);
		color: #ede9e3;
		opacity: 0;
		transition: opacity 150ms ease;
	}

	.cover-uploader:hover .cover-overlay {
		opacity: 1;
	}

	.hidden-input {
		display: none;
	}
</style>
