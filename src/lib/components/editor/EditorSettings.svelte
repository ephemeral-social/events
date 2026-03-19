<script lang="ts">
	import { getDraft, updateDraft, getFieldErrors } from '$lib/stores/event-draft.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	const draft = $derived(getDraft());
	const errors = $derived(getFieldErrors());
	const isElegant = $derived(draft.aesthetic === 'elegant');
	const isTicketed = $derived(draft.web_event_type === 'ticketed');
</script>

{#if open}
	<div class="editor-settings-overlay" data-testid="editor-settings">
		<div class="editor-settings-panel">
			<div class="settings-header">
				<h3>Settings</h3>
				<button class="close-btn" onclick={onClose}>Done</button>
			</div>

			<div class="settings-body">
				{#if isElegant}
					<div class="setting-field">
						<label for="subtitle">Subtitle</label>
						<input
							id="subtitle"
							type="text"
							value={draft.subtitle}
							placeholder="e.g., An Evening to Remember"
							oninput={(e) => updateDraft('subtitle', (e.target as HTMLInputElement).value)}
							data-testid="subtitle-input"
						/>
					</div>
				{/if}

				<div class="setting-field" class:has-error={errors.max_attendees}>
					<label for="max-attendees">Max attendees</label>
					<input
						id="max-attendees"
						type="number"
						value={draft.max_attendees ?? ''}
						placeholder="Unlimited"
						oninput={(e) => {
							const val = (e.target as HTMLInputElement).value;
							updateDraft('max_attendees', val ? parseInt(val, 10) : null);
						}}
						data-testid="max-attendees-input"
					/>
					{#if errors.max_attendees}
						<span class="field-error">{errors.max_attendees}</span>
					{/if}
				</div>

				<div class="setting-field setting-toggle">
					<label for="location-hidden">Hide location</label>
					<input
						id="location-hidden"
						type="checkbox"
						checked={draft.location_hidden}
						onchange={(e) => updateDraft('location_hidden', (e.target as HTMLInputElement).checked)}
						data-testid="location-hidden-toggle"
					/>
				</div>

				<div class="setting-field setting-toggle">
					<label for="show-guest-list">Show guest list</label>
					<input
						id="show-guest-list"
						type="checkbox"
						checked={draft.show_guest_list}
						onchange={(e) => updateDraft('show_guest_list', (e.target as HTMLInputElement).checked)}
						data-testid="show-guest-list-toggle"
					/>
				</div>

				<div class="setting-field">
					<label>Event type</label>
					<div class="radio-group">
						<label class="radio-label">
							<input
								type="radio"
								name="web_event_type"
								value="simple"
								checked={draft.web_event_type === 'simple'}
								onchange={() => updateDraft('web_event_type', 'simple')}
							/>
							Free
						</label>
						<label class="radio-label">
							<input
								type="radio"
								name="web_event_type"
								value="ticketed"
								checked={draft.web_event_type === 'ticketed'}
								onchange={() => updateDraft('web_event_type', 'ticketed')}
							/>
							Ticketed
						</label>
					</div>
				</div>

				{#if isTicketed}
					<div class="setting-field" class:has-error={errors.ticket_price_cents}>
						<label for="ticket-price">Ticket price (cents)</label>
						<input
							id="ticket-price"
							type="number"
							value={draft.ticket_price_cents ?? ''}
							placeholder="e.g., 2500 for $25"
							oninput={(e) => {
								const val = (e.target as HTMLInputElement).value;
								updateDraft('ticket_price_cents', val ? parseInt(val, 10) : null);
							}}
							data-testid="ticket-price-input"
						/>
						{#if errors.ticket_price_cents}
							<span class="field-error">{errors.ticket_price_cents}</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.editor-settings-overlay {
		position: fixed;
		inset: 0;
		z-index: 110;
		display: flex;
		align-items: flex-end;
		background: rgba(0, 0, 0, 0.5);
	}

	.editor-settings-panel {
		width: 100%;
		max-height: 70vh;
		overflow-y: auto;
		background: #1a1918;
		border-radius: 0.75rem 0.75rem 0 0;
		padding: 20px;
	}

	.settings-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}

	.settings-header h3 {
		color: #ede9e3;
		font-family: 'Manrope Variable', sans-serif;
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		color: #52b788;
		font-family: 'Manrope Variable', sans-serif;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		padding: 4px 8px;
	}

	.settings-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.setting-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.setting-field label {
		font-size: 0.75rem;
		color: #a39e96;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.setting-field input[type='text'],
	.setting-field input[type='number'] {
		background: #111110;
		border: 1px solid #2e2c2a;
		border-radius: 8px;
		padding: 8px 12px;
		color: #ede9e3;
		font: inherit;
		outline: none;
	}

	.setting-field input:focus {
		border-color: #52b788;
	}

	.setting-toggle {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	.radio-group {
		display: flex;
		gap: 16px;
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.875rem;
		color: #ede9e3;
		cursor: pointer;
		text-transform: none;
		letter-spacing: normal;
	}

	.has-error input[type='number'] {
		border-color: #e85d04;
	}

	.field-error {
		font-size: 0.6875rem;
		color: #e85d04;
		line-height: 1.2;
	}
</style>
