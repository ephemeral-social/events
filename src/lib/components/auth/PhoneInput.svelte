<!-- TODO: Add international country code support -->
<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		onSubmit: (phone: string) => void;
		loading?: boolean;
		error?: string;
	}

	let { onSubmit, loading = false, error }: Props = $props();
	let phone = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		const cleaned = phone.replace(/\D/g, '');
		if (cleaned.length >= 10) {
			const formatted = cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
			onSubmit(formatted);
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-4">
	<div>
		<label for="phone" class="text-label text-[var(--text-secondary)] mb-1.5 block">
			Phone number
		</label>
		<Input
			id="phone"
			type="tel"
			placeholder="(555) 123-4567"
			bind:value={phone}
			autocomplete="tel"
			disabled={loading}
		/>
	</div>
	{#if error}
		<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
	{/if}
	<Button type="submit" disabled={loading || phone.replace(/\D/g, '').length < 10}>
		{loading ? 'Sending...' : 'Send verification code'}
	</Button>
	<p class="text-caption text-[var(--text-muted)] text-center">
		We'll text you a code to verify your number.
	</p>
</form>
