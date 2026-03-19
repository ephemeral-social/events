<script lang="ts">
	import { getDraft, updateDraft, getFieldErrors } from '$lib/stores/event-draft.svelte';
	import { toLocalDatetime } from '$lib/utils/datetime';

	const draft = $derived(getDraft());
	const errors = $derived(getFieldErrors());

	function handleStartTimeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateDraft('start_time', target.value ? new Date(target.value).toISOString() : null);
	}

	function handleEndTimeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateDraft('end_time', target.value ? new Date(target.value).toISOString() : null);
	}

	function handleVenueNameChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateDraft('venue_name', target.value);
	}

	function handleVenueAddressChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateDraft('venue_address', target.value);
	}
</script>

<div class="editable-info-card" data-testid="editable-info-card">
	<div class="info-field" class:has-error={errors.start_time}>
		<label for="start-time">Start</label>
		<input
			id="start-time"
			type="datetime-local"
			value={toLocalDatetime(draft.start_time)}
			oninput={handleStartTimeChange}
		/>
		{#if errors.start_time}
			<span class="field-error">{errors.start_time}</span>
		{/if}
	</div>

	<div class="info-field" class:has-error={errors.end_time}>
		<label for="end-time">End</label>
		<input
			id="end-time"
			type="datetime-local"
			value={toLocalDatetime(draft.end_time)}
			oninput={handleEndTimeChange}
		/>
		{#if errors.end_time}
			<span class="field-error">{errors.end_time}</span>
		{/if}
	</div>

	<div class="info-field">
		<label for="venue-name">Venue</label>
		<input
			id="venue-name"
			type="text"
			value={draft.venue_name}
			placeholder="Venue name"
			oninput={handleVenueNameChange}
			data-testid="venue-name-input"
		/>
	</div>

	<div class="info-field">
		<label for="venue-address">Address</label>
		<input
			id="venue-address"
			type="text"
			value={draft.venue_address}
			placeholder="Venue address"
			oninput={handleVenueAddressChange}
			data-testid="venue-address-input"
		/>
	</div>
</div>

<style>
	.editable-info-card {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
		background: #1a1918;
		border-radius: 0.75rem;
		border: 1px solid #2e2c2a;
	}

	.info-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.info-field label {
		font-size: 0.75rem;
		color: #6b6560;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-field input {
		background: transparent;
		border: 1px solid #2e2c2a;
		border-radius: 8px;
		padding: 8px 12px;
		color: #ede9e3;
		font: inherit;
		outline: none;
		transition: border-color 150ms ease;
	}

	.info-field input:focus {
		border-color: #52b788;
	}

	.info-field input::placeholder {
		color: #6b6560;
	}

	.has-error input {
		border-color: #e85d04;
	}

	.field-error {
		font-size: 0.6875rem;
		color: #e85d04;
		line-height: 1.2;
	}
</style>
