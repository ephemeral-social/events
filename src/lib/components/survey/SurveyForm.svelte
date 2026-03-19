<script lang="ts">
	import { ClipboardText } from 'phosphor-svelte';
	import type { SurveyQuestion, SurveyResponse, ResponsePayload } from '$lib/types/survey';

	interface Props {
		questions: SurveyQuestion[];
		existingResponses?: SurveyResponse[];
		onSubmit: (responses: ResponsePayload[]) => void;
		submitting?: boolean;
	}

	let { questions, existingResponses = [], onSubmit, submitting = false }: Props = $props();

	// Local state for responses, keyed by question_id
	let answers = $state<Record<string, { text: string; selected: string[] }>>({});

	// Initialize from existing responses
	$effect(() => {
		const init: Record<string, { text: string; selected: string[] }> = {};
		for (const q of questions) {
			const existing = existingResponses.find((r) => r.question_id === q.question_id);
			init[q.question_id] = {
				text: existing?.response_text || '',
				selected: existing?.selected_options || []
			};
		}
		answers = init;
	});

	let allRequiredAnswered = $derived(() => {
		return questions
			.filter((q) => q.required)
			.every((q) => {
				const a = answers[q.question_id];
				if (!a) return false;
				if (q.question_type === 'short_answer') return a.text.trim().length > 0;
				return a.selected.length > 0;
			});
	});

	function toggleOption(questionId: string, option: string, isMulti: boolean) {
		const current = answers[questionId];
		if (!current) return;

		if (isMulti) {
			const idx = current.selected.indexOf(option);
			if (idx >= 0) {
				answers[questionId] = { ...current, selected: current.selected.filter((o) => o !== option) };
			} else {
				answers[questionId] = { ...current, selected: [...current.selected, option] };
			}
		} else {
			// Single-select: toggle off if already selected, otherwise replace
			if (current.selected[0] === option) {
				answers[questionId] = { ...current, selected: [] };
			} else {
				answers[questionId] = { ...current, selected: [option] };
			}
		}
	}

	function handleSubmit() {
		const payloads: ResponsePayload[] = questions.map((q) => {
			const a = answers[q.question_id];
			if (q.question_type === 'short_answer') {
				return { question_id: q.question_id, response_text: a?.text.trim() || null };
			}
			return { question_id: q.question_id, selected_options: a?.selected || [] };
		});
		onSubmit(payloads);
	}
</script>

<div class="space-y-4">
	<h4 class="flex items-center gap-2 text-label-md font-medium text-[var(--text-primary)]">
		<ClipboardText size={16} weight="duotone" class="text-[var(--accent-primary)]" />
		Host Questions
	</h4>

	{#each questions as q, i (q.question_id)}
		<div class="space-y-2">
			<label class="block text-body-sm font-medium text-[var(--text-secondary)]">
				{q.question_text}
				{#if q.required}
					<span class="text-[var(--feedback-error)]">*</span>
				{/if}
			</label>

			{#if q.question_type === 'short_answer'}
				<input
					type="text"
					maxlength={500}
					placeholder="Your answer..."
					value={answers[q.question_id]?.text || ''}
					oninput={(e) => {
						const val = (e.target as HTMLInputElement).value;
						answers[q.question_id] = { ...answers[q.question_id], text: val };
					}}
					class="survey-input"
				/>
			{:else if q.options}
				<div class="flex flex-wrap gap-2">
					{#each q.options.choices as choice (choice)}
						{@const isSelected = answers[q.question_id]?.selected.includes(choice)}
						<button
							type="button"
							class="survey-pill"
							class:survey-pill-active={isSelected}
							onclick={() => toggleOption(q.question_id, choice, q.options?.is_multi_select ?? false)}
						>
							{choice}
						</button>
					{/each}
				</div>
				{#if q.options.is_multi_select}
					<p class="text-[11px] text-[var(--text-muted)]">Select all that apply</p>
				{/if}
			{/if}
		</div>
	{/each}

	<button
		type="button"
		class="w-full rounded-full bg-[var(--accent-primary)] px-4 py-2.5 text-label-md font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-50"
		disabled={submitting || !allRequiredAnswered()}
		onclick={handleSubmit}
	>
		{submitting ? 'Submitting...' : 'Submit Answers'}
	</button>
</div>

<style>
	.survey-input {
		width: 100%;
		border-radius: 0.75rem;
		border: 1px solid var(--border-subtle);
		background: var(--surface-card);
		padding: 0.5rem 0.75rem;
		font-size: 14px;
		color: var(--text-primary);
		transition: border-color 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.survey-input::placeholder {
		color: var(--text-muted);
	}

	.survey-input:focus {
		outline: none;
		border-color: var(--accent-primary);
	}

	.survey-pill {
		padding: 0.375rem 0.875rem;
		border-radius: 9999px;
		border: 1px solid var(--border-default);
		background: transparent;
		color: var(--text-secondary);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.survey-pill:hover {
		border-color: var(--text-muted);
		background: var(--surface-card);
	}

	.survey-pill-active {
		background: var(--accent-primary);
		border-color: var(--accent-primary);
		color: var(--surface-base);
	}

	.survey-pill-active:hover {
		background: var(--accent-hover);
		border-color: var(--accent-hover);
	}
</style>
