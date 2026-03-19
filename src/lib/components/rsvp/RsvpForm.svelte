<script lang="ts">
	import { Check, X, Minus, UserPlus, ChatText } from 'phosphor-svelte';
	import { hapticLight } from '$lib/utils/haptics';

	interface Props {
		allowPlusOnes: boolean;
		status: 'going' | 'maybe' | 'declined';
		plusOnes: number;
		smsReminders: boolean;
		smsBlasts: boolean;
		onStatusChange: (status: 'going' | 'maybe' | 'declined') => void;
		onOptionsChange: (opts: { plus_ones: number; sms_reminders: boolean; sms_blasts: boolean }) => void;
	}

	let { allowPlusOnes, status, plusOnes, smsReminders, smsBlasts, onStatusChange, onOptionsChange }: Props = $props();

	let localPlusOnes = $state(plusOnes);
	let localSmsReminders = $state(smsReminders);
	let localSmsBlasts = $state(smsBlasts);

	$effect(() => { localPlusOnes = plusOnes; });
	$effect(() => { localSmsReminders = smsReminders; });
	$effect(() => { localSmsBlasts = smsBlasts; });

	function emitOptions() {
		onOptionsChange({ plus_ones: localPlusOnes, sms_reminders: localSmsReminders, sms_blasts: localSmsBlasts });
	}

	const statusOptions = [
		{ value: 'going' as const, label: 'Going', icon: Check },
		{ value: 'maybe' as const, label: 'Maybe', icon: Minus },
		{ value: 'declined' as const, label: "Can't Make It", icon: X }
	];
</script>

<div class="space-y-3">
	<!-- Status row -->
	<div class="flex gap-2">
		{#each statusOptions as opt (opt.value)}
			<button
				class="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-label-sm font-medium transition-all duration-150 active:scale-[0.97]
					{status === opt.value
					? opt.value === 'going'
						? 'bg-[var(--accent-primary)] text-[var(--surface-base)]'
						: opt.value === 'maybe'
							? 'bg-[var(--surface-card)] text-[var(--text-primary)] ring-1 ring-[var(--border-default)]'
							: 'bg-[var(--surface-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border-default)]'
					: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-card)]/50'}"
				aria-pressed={status === opt.value}
				onclick={() => { hapticLight(); onStatusChange(opt.value); }}
				type="button"
			>
				<opt.icon size={14} weight={status === opt.value ? 'bold' : 'regular'} />
				{opt.label}
			</button>
		{/each}
	</div>

	{#if status !== 'declined'}
		<div class="h-px bg-[var(--border-subtle)]"></div>

		<!-- Stacked option rows — consistent left-aligned layout -->
		<div class="space-y-2.5">
			<!-- Plus ones -->
			{#if allowPlusOnes}
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<UserPlus size={14} weight="regular" class="text-[var(--text-muted)]" />
						<span class="text-label-sm text-[var(--text-secondary)]">Plus ones</span>
					</div>
					<div class="flex items-center gap-1.5">
						<button
							type="button"
							aria-label="Decrease plus ones"
							class="stepper-btn"
							disabled={localPlusOnes === 0}
							onclick={() => { hapticLight(); localPlusOnes--; emitOptions(); }}
						>
							&minus;
						</button>
						<span class="w-5 text-center text-label-sm font-medium text-[var(--text-primary)] tabular-nums">{localPlusOnes}</span>
						<button
							type="button"
							aria-label="Increase plus ones"
							class="stepper-btn"
							disabled={localPlusOnes >= 10}
							onclick={() => { hapticLight(); localPlusOnes++; emitOptions(); }}
						>
							+
						</button>
					</div>
				</div>
			{/if}

			<!-- SMS notifications card -->
			<div class="sms-card">
				<!-- Header -->
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center gap-1.5">
						<ChatText size={13} weight="regular" class="text-[var(--text-muted)]" />
						<span class="text-label-sm text-[var(--text-secondary)]">Text notifications</span>
					</div>
					<span class="sms-optional-badge">Not required to RSVP</span>
				</div>

				<!-- Event reminders -->
				<label class="sms-row group">
					<div>
						<span class="sms-label group-hover:text-[var(--text-primary)]">Event reminders</span>
						<span class="sms-detail">I agree to receive text (SMS) reminders from Ephemeral about this event and related updates. You will receive up to 1 message per event.</span>
					</div>
					<input
						type="checkbox"
						bind:checked={localSmsReminders}
						onchange={() => { hapticLight(); emitOptions(); }}
						class="sms-checkbox"
					/>
				</label>

				<div class="sms-divider"></div>

				<!-- Host updates -->
				<label class="sms-row group">
					<div>
						<span class="sms-label group-hover:text-[var(--text-primary)]">Host updates</span>
						<span class="sms-detail">I agree to receive text (SMS) updates from the event host via Ephemeral about this event. You may receive up to 3 messages per event.</span>
					</div>
					<input
						type="checkbox"
						bind:checked={localSmsBlasts}
						onchange={() => { hapticLight(); emitOptions(); }}
						class="sms-checkbox"
					/>
				</label>

				<!-- Compliance footer -->
				<div class="sms-footer">
					Msg &amp; data rates may apply. Text HELP for help, STOP to cancel. Your number will not be shared or sold.
					<br />
					<a href="/terms" target="_blank" class="sms-link">Terms</a>
					<span class="mx-0.5">&middot;</span>
					<a href="/privacy" target="_blank" class="sms-link">Privacy</a>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.stepper-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 9999px;
		border: 1px solid var(--border-default);
		color: var(--text-secondary);
		font-size: 14px;
		line-height: 1;
		transition: all 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
		cursor: pointer;
		background: transparent;
	}

	.stepper-btn:hover:not(:disabled) {
		background: var(--surface-card);
		border-color: var(--text-muted);
	}

	.stepper-btn:active:not(:disabled) {
		transform: scale(0.9);
	}

	.stepper-btn:disabled {
		opacity: 0.25;
		cursor: default;
	}

	/* SMS notifications card */
	.sms-card {
		background: rgba(255, 248, 240, 0.035);
		border: 1px solid rgba(255, 248, 240, 0.06);
		border-radius: 12px;
		padding: 14px 16px;
	}

	.sms-optional-badge {
		font-size: 10px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-muted);
		opacity: 0.7;
	}

	.sms-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
		user-select: none;
		padding: 6px 0;
	}

	.sms-label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-secondary);
		transition: color 150ms;
	}

	.sms-detail {
		display: block;
		font-size: 11px;
		line-height: 1.3;
		color: var(--text-muted);
		opacity: 0.65;
		margin-top: 2px;
	}

	.sms-divider {
		height: 1px;
		background: rgba(255, 248, 240, 0.04);
		margin: 2px 0;
	}

	.sms-footer {
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid rgba(255, 248, 240, 0.04);
		font-size: 10px;
		line-height: 1.5;
		color: var(--text-muted);
		opacity: 0.55;
	}

	.sms-link {
		color: var(--accent-primary);
		opacity: 0.8;
		transition: opacity 150ms;
	}

	.sms-link:hover {
		opacity: 1;
	}

	.sms-checkbox {
		appearance: none;
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 5px;
		border: 1.5px solid var(--border-default);
		background: var(--surface-card);
		cursor: pointer;
		position: relative;
		transition: all 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
		flex-shrink: 0;
		margin-left: 12px;
	}

	.sms-checkbox:checked {
		background: var(--accent-primary);
		border-color: var(--accent-primary);
	}

	.sms-checkbox:checked::after {
		content: '';
		position: absolute;
		left: 5px;
		top: 2px;
		width: 5.5px;
		height: 9px;
		border: solid var(--surface-base);
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}

	.sms-checkbox:hover {
		border-color: var(--text-muted);
	}

	.sms-checkbox:checked:hover {
		border-color: var(--accent-hover);
		background: var(--accent-hover);
	}
</style>
