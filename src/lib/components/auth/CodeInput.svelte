<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		phone: string;
		onSubmit: (code: string) => void;
		onBack: () => void;
		loading?: boolean;
		error?: string;
	}

	let { phone, onSubmit, onBack, loading = false, error }: Props = $props();
	let code = $state('');
	let submitted = $state(false);
	let inputEl: HTMLInputElement | undefined = $state();

	// Transfer focus from the proxy input to the real code input on mount.
	// The iOS keyboard is already open (held by the proxy input in AuthModal),
	// so this focus swap preserves it. On desktop/Android this just focuses normally.
	// Use rAF fallback for cases where DOM isn't fully painted yet.
	$effect(() => {
		if (inputEl) {
			inputEl.focus();
			requestAnimationFrame(() => inputEl?.focus());
		}
	});

	// Auto-submit when 6 digits are entered
	$effect(() => {
		if (code.length === 6 && !loading && !submitted) {
			submitted = true;
			onSubmit(code);
		}
	});

	// Reset submitted flag if code changes (e.g. user corrects after error)
	$effect(() => {
		if (code.length < 6) {
			submitted = false;
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (code.length === 6 && !loading) {
			submitted = true;
			onSubmit(code);
		}
	}

	function formatPhone(e164: string): string {
		const digits = e164.replace(/\D/g, '');
		if (digits.length === 11 && digits.startsWith('1')) {
			return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
		}
		return e164;
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-4">
	<p class="text-body-sm text-[var(--text-secondary)] text-center">
		Code sent to {formatPhone(phone)}
	</p>
	<div>
		<label for="code" class="text-label text-[var(--text-secondary)] mb-1.5 block">
			Verification code
		</label>
		<Input
			id="code"
			name="one-time-code"
			type="text"
			inputmode="numeric"
			pattern="[0-9]*"
			maxlength={6}
			placeholder="000000"
			bind:value={code}
			bind:ref={inputEl}
			autocomplete="one-time-code"
			disabled={loading}
			class="text-center text-xl tracking-[0.3em]"
		/>
	</div>
	{#if error}
		<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
	{/if}
	<Button type="submit" disabled={loading || code.length !== 6}>
		{loading ? 'Verifying...' : 'Verify'}
	</Button>
	<button
		type="button"
		onclick={onBack}
		class="text-body-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
	>
		Use a different number
	</button>
</form>
