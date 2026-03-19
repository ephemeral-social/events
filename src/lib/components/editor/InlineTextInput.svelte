<script lang="ts">
	interface Props {
		value: string;
		oninput: (value: string) => void;
		placeholder?: string;
		class?: string;
		error?: string;
	}

	let { value, oninput, placeholder = '', class: className = '', error = '' }: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		oninput(target.value);
	}
</script>

<div class="inline-text-wrapper">
	<input
		type="text"
		{value}
		{placeholder}
		class="inline-text-input {className}"
		class:has-error={error}
		data-testid="inline-text-input"
		oninput={handleInput}
	/>
	{#if error}
		<span class="field-error">{error}</span>
	{/if}
</div>

<style>
	.inline-text-input {
		background: transparent;
		border: none;
		border-bottom: 1px dashed transparent;
		outline: none;
		font: inherit;
		color: inherit;
		width: 100%;
		padding: 2px 4px;
		margin: -2px -4px;
		border-radius: 4px;
		transition: all 150ms ease;
	}

	.inline-text-input:hover {
		background: color-mix(in srgb, var(--foreground, #ede9e3) 5%, transparent);
	}

	.inline-text-input:focus {
		border-bottom-color: var(--border, #2e2c2a);
		background: color-mix(in srgb, var(--foreground, #ede9e3) 3%, transparent);
	}

	.inline-text-input::placeholder {
		color: #6b6560;
	}

	.inline-text-wrapper {
		display: contents;
	}

	.has-error {
		border-bottom-color: #e85d04 !important;
		border-bottom-style: solid;
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
