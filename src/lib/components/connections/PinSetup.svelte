<script lang="ts">
	import { ShieldCheck, Check } from 'phosphor-svelte';
	import PinInput from './PinInput.svelte';
	import { generateConnectionKeys, idbSet } from '$lib/crypto/connections';
	import { unlockWithPin } from '$lib/stores/connections.svelte';

	interface Props {
		onComplete: () => void;
	}

	let { onComplete }: Props = $props();

	let step = $state<'enter' | 'confirm' | 'generating' | 'success'>('enter');
	let firstPin = $state('');
	let error = $state('');
	let confirmInputRef: { clear: () => void } | undefined = $state();

	async function handleFirstPin(pin: string) {
		firstPin = pin;
		step = 'confirm';
	}

	async function handleConfirmPin(pin: string) {
		if (pin !== firstPin) {
			error = 'PINs do not match. Try again.';
			confirmInputRef?.clear();
			return;
		}

		error = '';
		step = 'generating';

		try {
			// Init keys on backend (get salt + pepper)
			const initRes = await fetch('/api/connections/keys/init', { method: 'POST' });
			if (!initRes.ok) throw new Error('Failed to initialize');
			const initData = (await initRes.json()) as { salt: string; pepper: string };

			// Generate key pair client-side
			const keys = await generateConnectionKeys(pin, initData.pepper, initData.salt);

			// Save public key + encrypted private key to backend
			const saveRes = await fetch('/api/connections/keys', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					public_key_jwk: keys.publicKeyJwk,
					encrypted_private_key: keys.encryptedPrivateKey
				})
			});
			if (!saveRes.ok) throw new Error('Failed to save keys');

			// Cache keys in IDB
			await idbSet('privateKey', keys.privateKey);
			await idbSet('storeKey', keys.storeKey);

			// Auto-unlock with the PIN just created (loads connections too)
			await unlockWithPin(pin);

			step = 'success';
			setTimeout(onComplete, 1500);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Setup failed';
			step = 'enter';
			firstPin = '';
		}
	}
</script>

<div class="flex flex-col items-center py-8 px-4">
	{#if step === 'enter'}
		<div
			class="flex h-16 w-16 items-center justify-center rounded-2xl mb-6"
			style="background: var(--accent-muted)"
		>
			<ShieldCheck size={28} weight="regular" color="var(--accent-primary)" />
		</div>
		<h3 class="text-headline-sm text-[var(--text-primary)] mb-2 text-center">
			Set Up Connections
		</h3>
		<p class="text-body-sm text-[var(--text-muted)] mb-8 text-center max-w-xs">
			Choose a 4-digit PIN to encrypt your connection data. You will need this PIN to view your
			connections.
		</p>
		<PinInput onSubmit={handleFirstPin} label="Choose a PIN" error={error} />
	{:else if step === 'confirm'}
		<div
			class="flex h-16 w-16 items-center justify-center rounded-2xl mb-6"
			style="background: var(--accent-muted)"
		>
			<ShieldCheck size={28} weight="regular" color="var(--accent-primary)" />
		</div>
		<h3 class="text-headline-sm text-[var(--text-primary)] mb-2 text-center">Confirm PIN</h3>
		<p class="text-body-sm text-[var(--text-muted)] mb-8 text-center max-w-xs">
			Enter your PIN again to confirm.
		</p>
		<PinInput
			bind:this={confirmInputRef}
			onSubmit={handleConfirmPin}
			label="Confirm your PIN"
			{error}
		/>
		<button
			class="mt-6 text-body-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
			onclick={() => {
				step = 'enter';
				firstPin = '';
				error = '';
			}}
		>
			Start over
		</button>
	{:else if step === 'generating'}
		<div class="flex flex-col items-center gap-4 py-12">
			<div class="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent-primary)]"></div>
			<p class="text-body-md text-[var(--text-secondary)]">Generating encryption keys...</p>
			<p class="text-body-sm text-[var(--text-muted)]">This may take a moment</p>
		</div>
	{:else}
		<div class="flex flex-col items-center gap-4 py-12">
			<div
				class="flex h-16 w-16 items-center justify-center rounded-full"
				style="background: var(--accent-muted)"
			>
				<Check size={32} weight="bold" color="var(--accent-primary)" />
			</div>
			<h3 class="text-headline-sm text-[var(--text-primary)]">All set</h3>
			<p class="text-body-sm text-[var(--text-muted)]">Your connections are now encrypted.</p>
		</div>
	{/if}
</div>
