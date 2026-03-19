<script lang="ts">
	import { TextT, ListBullets, Trash, Plus } from 'phosphor-svelte';
	import type { SurveyQuestion } from '$lib/types/survey';

	interface Props {
		questions: SurveyQuestion[];
		onSave: (questions: SurveyQuestion[]) => void;
		saving: boolean;
	}

	let { questions, onSave, saving }: Props = $props();

	// Deep-clone questions into local editable state
	let localQuestions = $state<SurveyQuestion[]>([]);

	$effect(() => {
		localQuestions = questions.map((q) => ({
			...q,
			options: q.options ? { ...q.options, choices: [...q.options.choices] } : null
		}));
	});

	const MAX_QUESTIONS = 5;
	const MAX_OPTIONS = 20;

	function addQuestion() {
		if (localQuestions.length >= MAX_QUESTIONS) return;
		localQuestions = [
			...localQuestions,
			{
				question_id: `new-${Date.now()}-${localQuestions.length}`,
				event_id: '',
				question_text: '',
				question_type: 'short_answer',
				required: false,
				options: null,
				position: localQuestions.length + 1
			}
		];
	}

	function removeQuestion(index: number) {
		localQuestions = localQuestions
			.filter((_, i) => i !== index)
			.map((q, i) => ({ ...q, position: i + 1 }));
	}

	function setType(index: number, type: 'short_answer' | 'dropdown') {
		const q = localQuestions[index];
		localQuestions[index] = {
			...q,
			question_type: type,
			options: type === 'dropdown' ? (q.options || { choices: [''], is_multi_select: false }) : null
		};
	}

	function addOption(qIndex: number) {
		const q = localQuestions[qIndex];
		if (!q.options || q.options.choices.length >= MAX_OPTIONS) return;
		localQuestions[qIndex] = {
			...q,
			options: { ...q.options, choices: [...q.options.choices, ''] }
		};
	}

	function removeOption(qIndex: number, optIndex: number) {
		const q = localQuestions[qIndex];
		if (!q.options) return;
		localQuestions[qIndex] = {
			...q,
			options: { ...q.options, choices: q.options.choices.filter((_, i) => i !== optIndex) }
		};
	}

	function updateOptionText(qIndex: number, optIndex: number, value: string) {
		const q = localQuestions[qIndex];
		if (!q.options) return;
		const newChoices = [...q.options.choices];
		newChoices[optIndex] = value;
		localQuestions[qIndex] = { ...q, options: { ...q.options, choices: newChoices } };
	}

	function handleSave() {
		onSave(localQuestions.map((q, i) => ({ ...q, position: i + 1 })));
	}
</script>

<div class="space-y-4">
	{#each localQuestions as q, qIndex (q.question_id)}
		<div class="question-card">
			<div class="flex items-start justify-between gap-2 mb-3">
				<span class="question-number">{qIndex + 1}</span>
				<button
					type="button"
					class="delete-btn"
					onclick={() => removeQuestion(qIndex)}
					aria-label="Delete question"
				>
					<Trash size={14} weight="regular" />
				</button>
			</div>

			<!-- Question text -->
			<textarea
				maxlength={500}
				placeholder="Enter your question..."
				rows={2}
				value={q.question_text}
				oninput={(e) => {
					localQuestions[qIndex] = { ...q, question_text: (e.target as HTMLTextAreaElement).value };
				}}
				class="question-textarea"
			></textarea>

			<!-- Type toggle -->
			<div class="flex gap-2 mt-3">
				<button
					type="button"
					class="type-pill"
					class:type-pill-active={q.question_type === 'short_answer'}
					onclick={() => setType(qIndex, 'short_answer')}
				>
					<TextT size={13} weight="regular" />
					Short Answer
				</button>
				<button
					type="button"
					class="type-pill"
					class:type-pill-active={q.question_type === 'dropdown'}
					onclick={() => setType(qIndex, 'dropdown')}
				>
					<ListBullets size={13} weight="regular" />
					Dropdown
				</button>
			</div>

			<!-- Required toggle -->
			<label class="required-toggle">
				<input
					type="checkbox"
					checked={q.required}
					onchange={() => {
						localQuestions[qIndex] = { ...q, required: !q.required };
					}}
					class="toggle-checkbox"
				/>
				<span class="text-body-sm text-[var(--text-secondary)]">Required</span>
			</label>

			<!-- Dropdown options -->
			{#if q.question_type === 'dropdown' && q.options}
				<div class="mt-3 space-y-2">
					{#each q.options.choices as opt, optIndex (optIndex)}
						<div class="flex items-center gap-2">
							<input
								type="text"
								maxlength={200}
								placeholder={`Option ${optIndex + 1}`}
								value={opt}
								oninput={(e) => updateOptionText(qIndex, optIndex, (e.target as HTMLInputElement).value)}
								class="option-input"
							/>
							<button
								type="button"
								class="option-delete-btn"
								onclick={() => removeOption(qIndex, optIndex)}
								aria-label="Remove option"
							>
								<Trash size={12} weight="regular" />
							</button>
						</div>
					{/each}

					<button
						type="button"
						class="add-option-btn"
						disabled={q.options.choices.length >= MAX_OPTIONS}
						onclick={() => addOption(qIndex)}
					>
						<Plus size={12} weight="bold" />
						Add option
					</button>

					<!-- Multi-select toggle -->
					<label class="required-toggle">
						<input
							type="checkbox"
							checked={q.options.is_multi_select}
							onchange={() => {
								if (!q.options) return;
								localQuestions[qIndex] = {
									...q,
									options: { ...q.options, is_multi_select: !q.options.is_multi_select }
								};
							}}
							class="toggle-checkbox"
						/>
						<span class="text-body-sm text-[var(--text-secondary)]">Allow multiple selections</span>
					</label>
				</div>
			{/if}
		</div>
	{/each}

	<!-- Add question -->
	<div class="flex items-center justify-between">
		<button
			type="button"
			class="add-question-btn"
			disabled={localQuestions.length >= MAX_QUESTIONS}
			onclick={addQuestion}
		>
			<Plus size={14} weight="bold" />
			Add Question
		</button>
		{#if localQuestions.length >= MAX_QUESTIONS}
			<span class="text-[11px] text-[var(--text-muted)]">5 question limit</span>
		{/if}
	</div>

	<!-- Save -->
	<button
		type="button"
		class="save-btn"
		disabled={saving}
		onclick={handleSave}
	>
		{saving ? 'Saving...' : 'Save Questions'}
	</button>
</div>

<style>
	.question-card {
		border: 1px solid var(--border-subtle);
		border-radius: 0.75rem;
		background: var(--surface-card);
		padding: 1rem;
	}

	.question-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 9999px;
		background: var(--surface-overlay);
		color: var(--text-muted);
		font-size: 11px;
		font-weight: 600;
	}

	.delete-btn {
		padding: 0.25rem;
		border-radius: 0.375rem;
		color: var(--feedback-error);
		cursor: pointer;
		background: transparent;
		border: none;
		transition: background 150ms;
	}

	.delete-btn:hover {
		background: rgba(232, 93, 4, 0.1);
	}

	.question-textarea {
		width: 100%;
		border-radius: 0.5rem;
		border: 1px solid var(--border-subtle);
		background: var(--surface-overlay);
		padding: 0.5rem 0.75rem;
		font-size: 14px;
		color: var(--text-primary);
		resize: none;
		transition: border-color 150ms;
	}

	.question-textarea::placeholder {
		color: var(--text-muted);
	}

	.question-textarea:focus {
		outline: none;
		border-color: var(--accent-primary);
	}

	.type-pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		border: 1px solid var(--border-default);
		background: transparent;
		color: var(--text-muted);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.type-pill:hover {
		border-color: var(--text-muted);
		color: var(--text-secondary);
	}

	.type-pill-active {
		background: var(--surface-overlay);
		border-color: var(--accent-primary);
		color: var(--text-primary);
	}

	.required-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
		cursor: pointer;
		user-select: none;
	}

	.toggle-checkbox {
		appearance: none;
		-webkit-appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 4px;
		border: 1.5px solid var(--border-default);
		background: var(--surface-card);
		cursor: pointer;
		position: relative;
		transition: all 150ms;
		flex-shrink: 0;
	}

	.toggle-checkbox:checked {
		background: var(--accent-primary);
		border-color: var(--accent-primary);
	}

	.toggle-checkbox:checked::after {
		content: '';
		position: absolute;
		left: 4px;
		top: 1px;
		width: 5px;
		height: 8px;
		border: solid var(--surface-base);
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}

	.option-input {
		flex: 1;
		border-radius: 0.5rem;
		border: 1px solid var(--border-subtle);
		background: var(--surface-overlay);
		padding: 0.375rem 0.625rem;
		font-size: 13px;
		color: var(--text-primary);
		transition: border-color 150ms;
	}

	.option-input::placeholder {
		color: var(--text-muted);
	}

	.option-input:focus {
		outline: none;
		border-color: var(--accent-primary);
	}

	.option-delete-btn {
		padding: 0.375rem;
		border-radius: 0.375rem;
		color: var(--text-muted);
		cursor: pointer;
		background: transparent;
		border: none;
		transition: all 150ms;
	}

	.option-delete-btn:hover {
		color: var(--feedback-error);
		background: rgba(232, 93, 4, 0.1);
	}

	.add-option-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		border: 1px dashed var(--border-default);
		background: transparent;
		color: var(--text-muted);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms;
	}

	.add-option-btn:hover:not(:disabled) {
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}

	.add-option-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.add-question-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		border: 1px dashed var(--border-default);
		background: transparent;
		color: var(--text-secondary);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.add-question-btn:hover:not(:disabled) {
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}

	.add-question-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.save-btn {
		width: 100%;
		padding: 0.625rem 1rem;
		border-radius: 9999px;
		background: var(--accent-primary);
		color: var(--surface-base);
		font-size: 14px;
		font-weight: 600;
		border: none;
		cursor: pointer;
		transition: all 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.save-btn:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.save-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
