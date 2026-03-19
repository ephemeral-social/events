<script lang="ts">
	interface Props {
		value: string;
		oninput: (value: string) => void;
		placeholder?: string;
		error?: string;
	}

	let { value, oninput, placeholder = 'Add a description...', error = '' }: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		target.style.height = 'auto';
		target.style.height = `${target.scrollHeight}px`;
		oninput(target.value);
	}
</script>

<div class="editable-description-wrapper">
	<textarea
		{value}
		{placeholder}
		class="editable-description"
		class:has-error={error}
		data-testid="editable-description"
		oninput={handleInput}
		rows="2"
	></textarea>
	{#if error}
		<span class="field-error">{error}</span>
	{/if}
</div>

<style>
	.editable-description {
		background: transparent;
		border: none;
		outline: none;
		font: inherit;
		color: inherit;
		width: 100%;
		padding: 0;
		resize: none;
		overflow: hidden;
		min-height: 3em;
	}

	.editable-description::placeholder {
		color: #6b6560;
	}

	.editable-description-wrapper {
		width: 100%;
	}

	.has-error {
		border-bottom: 1px solid #e85d04;
	}

	.field-error {
		display: block;
		font-size: 0.6875rem;
		color: #e85d04;
		font-family: 'Manrope Variable', sans-serif;
		font-weight: 500;
		line-height: 1.2;
		margin-top: 2px;
	}
</style>
