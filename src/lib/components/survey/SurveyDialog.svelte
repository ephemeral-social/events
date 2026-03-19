<script lang="ts">
	import { X, SpinnerGap } from 'phosphor-svelte';
	import { toastSuccess, toastError } from '$lib/stores/toast.svelte';
	import SurveyBuilder from './SurveyBuilder.svelte';
	import SurveyResponses from './SurveyResponses.svelte';
	import type { SurveyQuestion } from '$lib/types/survey';

	interface Props {
		open: boolean;
		eventId: string;
		isHost: boolean;
		onClose: () => void;
	}

	let { open, eventId, isHost, onClose }: Props = $props();

	let tab = $state<'questions' | 'responses'>('questions');
	let questions = $state<SurveyQuestion[]>([]);
	let loading = $state(true);
	let saving = $state(false);

	$effect(() => {
		if (open) {
			loadQuestions();
		}
	});

	async function loadQuestions() {
		loading = true;
		try {
			const res = await fetch(`/api/events/${eventId}/survey/questions`);
			if (res.ok) {
				const data = (await res.json()) as { questions?: SurveyQuestion[] };
				questions = data.questions || [];
			} else {
				questions = [];
			}
		} catch {
			questions = [];
		} finally {
			loading = false;
		}
	}

	async function handleSave(updated: SurveyQuestion[]) {
		saving = true;
		try {
			const res = await fetch(`/api/events/${eventId}/survey/questions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					questions: updated.map((q) => ({
						question_text: q.question_text,
						question_type: q.question_type,
						required: q.required,
						options: q.options,
						position: q.position
					}))
				})
			});

			if (!res.ok) {
				const errData = (await res.json().catch(() => ({}))) as { error?: string };
				toastError(errData.error || 'Failed to save questions');
				return;
			}

			const data = (await res.json()) as { questions?: SurveyQuestion[] };
			questions = data.questions || [];
			toastSuccess('Questions saved');
		} catch {
			toastError('Network error');
		} finally {
			saving = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="survey-dialog"
		class:survey-dialog-open={open}
		role="dialog"
		aria-modal="true"
		aria-label="Guest Survey"
		tabindex="0"
		onkeydown={handleKeydown}
	>
		<!-- Header -->
		<div class="dialog-header">
			<h2 class="font-serif text-lg font-semibold text-[var(--text-primary)]">Guest Survey</h2>
			<button
				type="button"
				class="close-btn"
				onclick={onClose}
				aria-label="Close survey"
			>
				<X size={20} weight="bold" />
			</button>
		</div>

		<!-- Tab bar -->
		<div class="tab-bar">
			<button
				type="button"
				class="tab-pill"
				class:tab-pill-active={tab === 'questions'}
				onclick={() => { tab = 'questions'; }}
			>
				Questions
			</button>
			{#if isHost}
				<button
					type="button"
					class="tab-pill"
					class:tab-pill-active={tab === 'responses'}
					onclick={() => { tab = 'responses'; }}
				>
					Responses
				</button>
			{/if}
		</div>

		<!-- Content -->
		<div class="dialog-content">
			{#if loading}
				<div class="flex items-center justify-center py-16">
					<SpinnerGap size={28} class="animate-spin text-[var(--text-muted)]" />
				</div>
			{:else if tab === 'questions'}
				<SurveyBuilder {questions} onSave={handleSave} {saving} />
			{:else}
				<SurveyResponses {eventId} />
			{/if}
		</div>
	</div>
{/if}

<style>
	.survey-dialog {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: var(--surface-base);
		display: flex;
		flex-direction: column;
		transform: translateY(100%);
		transition: transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.survey-dialog-open {
		transform: translateY(0);
	}

	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;
	}

	.close-btn {
		padding: 0.375rem;
		border-radius: 0.5rem;
		color: var(--text-muted);
		cursor: pointer;
		background: transparent;
		border: none;
		transition: all 150ms;
	}

	.close-btn:hover {
		color: var(--text-primary);
		background: var(--surface-card);
	}

	.tab-bar {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;
	}

	.tab-pill {
		padding: 0.375rem 1rem;
		border-radius: 9999px;
		border: 1px solid var(--border-default);
		background: transparent;
		color: var(--text-muted);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.tab-pill:hover {
		color: var(--text-secondary);
		border-color: var(--text-muted);
	}

	.tab-pill-active {
		background: var(--surface-overlay);
		border-color: var(--accent-primary);
		color: var(--text-primary);
	}

	.dialog-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.25rem;
		-webkit-overflow-scrolling: touch;
	}
</style>
