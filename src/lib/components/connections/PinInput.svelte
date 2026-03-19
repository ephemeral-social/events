<script lang="ts">
	interface Props {
		onSubmit: (pin: string) => void;
		loading?: boolean;
		error?: string;
		label?: string;
	}

	let { onSubmit, loading = false, error, label = 'Enter your PIN' }: Props = $props();

	let digits = $state(['', '', '', '']);
	let inputRefs: HTMLInputElement[] = $state([]);
	let submitted = $state(false);
	// Track which digit was most recently typed (for brief reveal)
	let revealIndex = $state<number | null>(null);
	let revealTimer: ReturnType<typeof setTimeout> | null = null;

	function revealBriefly(index: number) {
		if (revealTimer) clearTimeout(revealTimer);
		revealIndex = index;
		revealTimer = setTimeout(() => {
			revealIndex = null;
		}, 300);
	}

	function handleInput(index: number, e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value.replace(/\D/g, '');

		if (value.length > 0) {
			digits[index] = value[0];
			revealBriefly(index);
			// Auto-advance to next input
			if (index < 3) {
				inputRefs[index + 1]?.focus();
			}
		} else {
			digits[index] = '';
		}

		// Auto-submit on 4th digit
		const pin = digits.join('');
		if (pin.length === 4 && !loading && !submitted) {
			submitted = true;
			onSubmit(pin);
		}
	}

	function handleKeydown(index: number, e: KeyboardEvent) {
		if (e.key === 'Backspace' && !digits[index] && index > 0) {
			// Move back on empty backspace
			inputRefs[index - 1]?.focus();
		}
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const pasted = e.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 4) || '';
		for (let i = 0; i < 4; i++) {
			digits[i] = pasted[i] || '';
		}
		// Focus the next empty slot, or last slot if all filled
		const nextEmpty = digits.findIndex((d) => !d);
		inputRefs[nextEmpty >= 0 ? nextEmpty : 3]?.focus();

		// Auto-submit if full
		if (pasted.length === 4 && !loading && !submitted) {
			submitted = true;
			onSubmit(pasted);
		}
	}

	// Reset submitted flag on digit change
	$effect(() => {
		const pin = digits.join('');
		if (pin.length < 4) {
			submitted = false;
		}
	});

	// Focus first input on mount
	$effect(() => {
		inputRefs[0]?.focus();
	});

	export function clear() {
		digits = ['', '', '', ''];
		submitted = false;
		revealIndex = null;
		if (revealTimer) clearTimeout(revealTimer);
		inputRefs[0]?.focus();
	}
</script>

<div class="flex flex-col items-center gap-4">
	<p class="text-body-sm text-[var(--text-secondary)]">{label}</p>

	<div class="flex gap-3" role="group" aria-label="PIN input">
		{#each digits as _, i}
			<div class="relative">
				<!-- Hidden real input -->
				<input
					bind:this={inputRefs[i]}
					type="text"
					inputmode="numeric"
					pattern="[0-9]*"
					maxlength={1}
					autocomplete="off"
					disabled={loading}
					value={digits[i]}
					oninput={(e) => handleInput(i, e)}
					onkeydown={(e) => handleKeydown(i, e)}
					onpaste={handlePaste}
					aria-label="PIN digit {i + 1}"
					class="absolute inset-0 h-14 w-12 opacity-0 cursor-pointer z-10"
				/>
				<!-- Visual display -->
				<div
					class="h-14 w-12 rounded-xl border text-center text-xl font-semibold transition-all duration-150 flex items-center justify-center select-none
						{digits[i]
						? 'border-[var(--accent-primary)] bg-[var(--surface-overlay)]'
						: 'border-[var(--border-default)] bg-[var(--surface-card)]'}
						{loading ? 'opacity-50' : ''}"
					style="font-family: var(--font-body)"
				>
					{#if digits[i]}
						{#if revealIndex === i}
							<span class="text-[var(--text-primary)]">{digits[i]}</span>
						{:else}
							<span class="text-[var(--text-primary)] text-2xl leading-none" style="margin-top: 2px">&bull;</span>
						{/if}
					{/if}
				</div>
				<!-- Dot indicator below -->
				<div
					class="absolute -bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full transition-colors duration-150
						{digits[i] ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-default)]'}"
				></div>
			</div>
		{/each}
	</div>

	{#if error}
		<p class="text-body-sm text-[var(--feedback-error)] mt-1">{error}</p>
	{/if}

	{#if loading}
		<p class="text-body-sm text-[var(--text-muted)] mt-1">Verifying...</p>
	{/if}
</div>
