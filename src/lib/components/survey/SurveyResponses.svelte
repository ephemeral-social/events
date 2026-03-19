<script lang="ts">
	import { CaretDown, ClipboardText, SpinnerGap } from 'phosphor-svelte';
	import { toastSuccess, toastError } from '$lib/stores/toast.svelte';
	import type { SurveyQuestion } from '$lib/types/survey';

	interface GuestResponse {
		question_id: string;
		response_text: string | null;
		selected_options: string[] | null;
		user_id: string;
		display_name: string;
	}

	interface ResponseData {
		questions: SurveyQuestion[];
		responses: GuestResponse[];
	}

	interface Props {
		eventId: string;
	}

	let { eventId }: Props = $props();

	let view = $state<'question' | 'guest'>('question');
	let loading = $state(true);
	let data = $state<ResponseData | null>(null);
	let expandedIds = $state<Set<string>>(new Set());

	$effect(() => {
		loadResponses();
	});

	async function loadResponses() {
		loading = true;
		try {
			const res = await fetch(`/api/events/${eventId}/survey/responses`);
			if (!res.ok) throw new Error('Failed to load');
			data = await res.json();
		} catch {
			data = null;
		} finally {
			loading = false;
		}
	}

	function toggleExpand(id: string) {
		const next = new Set(expandedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		expandedIds = next;
	}

	// Group responses by question
	let byQuestion = $derived(() => {
		if (!data) return [];
		const questions = data.questions || [];
		const allResponses = data.responses || [];
		return questions.map((q) => ({
			question: q,
			responses: allResponses.filter((r) => r.question_id === q.question_id)
		}));
	});

	// Group responses by guest
	let byGuest = $derived(() => {
		if (!data) return [];
		const responses = data.responses || [];
		const map = new Map<string, { display_name: string; responses: GuestResponse[] }>();
		for (const r of responses) {
			if (!map.has(r.user_id)) {
				map.set(r.user_id, { display_name: r.display_name, responses: [] });
			}
			map.get(r.user_id)!.responses.push(r);
		}
		return Array.from(map.entries()).map(([userId, g]) => ({ userId, ...g }));
	});

	// Compute dropdown option counts for bar chart
	function getOptionCounts(question: SurveyQuestion, responses: GuestResponse[]): { label: string; count: number }[] {
		if (!question.options) return [];
		return question.options.choices.map((choice) => ({
			label: choice,
			count: responses.filter((r) => r.selected_options?.includes(choice)).length
		}));
	}

	function findQuestion(questionId: string): SurveyQuestion | undefined {
		return data?.questions.find((q) => q.question_id === questionId);
	}

	async function copyCSV() {
		if (!data) return;
		const questions = data.questions || [];
		const guests = byGuest();

		const header = ['Guest', ...questions.map((q) => q.question_text)];
		const rows = guests.map((g) => {
			const cells = questions.map((q) => {
				const r = g.responses.find((resp) => resp.question_id === q.question_id);
				if (!r) return '';
				if (r.response_text) return r.response_text;
				if (r.selected_options) return r.selected_options.join('; ');
				return '';
			});
			return [g.display_name, ...cells];
		});

		const csv = [header, ...rows]
			.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
			.join('\n');

		try {
			await navigator.clipboard.writeText(csv);
			toastSuccess('Copied CSV to clipboard');
		} catch {
			toastError('Failed to copy');
		}
	}
</script>

<div class="space-y-4">
	<!-- View toggle + CSV -->
	<div class="flex items-center justify-between">
		<div class="flex gap-2">
			<button
				type="button"
				class="view-pill"
				class:view-pill-active={view === 'question'}
				onclick={() => { view = 'question'; }}
			>
				By Question
			</button>
			<button
				type="button"
				class="view-pill"
				class:view-pill-active={view === 'guest'}
				onclick={() => { view = 'guest'; }}
			>
				By Guest
			</button>
		</div>
		<button
			type="button"
			class="csv-btn"
			onclick={copyCSV}
			disabled={loading || !data}
		>
			<ClipboardText size={14} weight="regular" />
			Copy CSV
		</button>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<SpinnerGap size={24} class="animate-spin text-[var(--text-muted)]" />
		</div>
	{:else if !data || (data.responses || []).length === 0}
		<p class="py-8 text-center text-body-sm text-[var(--text-muted)]">No responses yet.</p>
	{:else if view === 'question'}
		{#each byQuestion() as { question, responses } (question.question_id)}
			<div class="response-card">
				<button
					type="button"
					class="card-header"
					onclick={() => toggleExpand(question.question_id)}
				>
					<span class="text-body-sm font-medium text-[var(--text-primary)]">
						{question.question_text}
					</span>
					<span class="flex items-center gap-2">
						<span class="text-[11px] text-[var(--text-muted)]">{responses.length} {responses.length === 1 ? 'response' : 'responses'}</span>
						<CaretDown
							size={14}
							weight="bold"
							class="caret text-[var(--text-muted)]"
							style="transform: rotate({expandedIds.has(question.question_id) ? '180deg' : '0deg'})"
						/>
					</span>
				</button>

				{#if expandedIds.has(question.question_id)}
					<div class="card-body">
						{#if question.question_type === 'dropdown' && question.options}
							{@const counts = getOptionCounts(question, responses)}
							{@const maxCount = Math.max(...counts.map((c) => c.count), 1)}
							<div class="space-y-2">
								{#each counts as { label, count } (label)}
									<div class="bar-row">
										<div class="bar-label">{label}</div>
										<div class="bar-track">
											<div
												class="bar-fill"
												style="width: {(count / maxCount) * 100}%"
											></div>
										</div>
										<div class="bar-count">{count}</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="space-y-1.5">
								{#each responses as r (r.user_id)}
									<div class="text-response-row">
										<span class="text-[12px] font-medium text-[var(--text-secondary)]">{r.display_name}</span>
										<span class="text-body-sm text-[var(--text-primary)]">{r.response_text || '—'}</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	{:else}
		{#each byGuest() as guest (guest.userId)}
			<div class="response-card">
				<button
					type="button"
					class="card-header"
					onclick={() => toggleExpand(guest.userId)}
				>
					<span class="text-body-sm font-medium text-[var(--text-primary)]">{guest.display_name}</span>
					<CaretDown
						size={14}
						weight="bold"
						class="caret text-[var(--text-muted)]"
						style="transform: rotate({expandedIds.has(guest.userId) ? '180deg' : '0deg'})"
					/>
				</button>

				{#if expandedIds.has(guest.userId)}
					<div class="card-body space-y-2">
						{#each guest.responses as r (r.question_id)}
							{@const q = findQuestion(r.question_id)}
							<div class="guest-answer">
								<span class="text-[12px] text-[var(--text-muted)]">{q?.question_text || 'Question'}</span>
								<span class="text-body-sm text-[var(--text-primary)]">
									{r.response_text || r.selected_options?.join(', ') || '—'}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	{/if}
</div>

<style>
	.view-pill {
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		border: 1px solid var(--border-default);
		background: transparent;
		color: var(--text-muted);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms;
	}

	.view-pill:hover {
		color: var(--text-secondary);
		border-color: var(--text-muted);
	}

	.view-pill-active {
		background: var(--surface-overlay);
		border-color: var(--accent-primary);
		color: var(--text-primary);
	}

	.csv-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		border: 1px solid var(--border-default);
		background: transparent;
		color: var(--text-secondary);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms;
	}

	.csv-btn:hover:not(:disabled) {
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}

	.csv-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.response-card {
		border: 1px solid var(--border-subtle);
		border-radius: 0.75rem;
		background: var(--surface-card);
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 150ms;
	}

	.card-header:hover {
		background: var(--surface-overlay);
	}

	.card-body {
		padding: 0 1rem 0.75rem;
	}

	/* Bar chart for dropdown responses */
	.bar-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.bar-label {
		width: 80px;
		font-size: 12px;
		color: var(--text-secondary);
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.bar-track {
		flex: 1;
		height: 20px;
		background: var(--surface-overlay);
		border-radius: 4px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: var(--accent-primary);
		border-radius: 4px;
		min-width: 2px;
		transition: width 300ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.bar-count {
		width: 24px;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
		text-align: left;
		flex-shrink: 0;
	}

	.text-response-row {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.375rem 0;
		border-bottom: 1px solid var(--border-subtle);
	}

	.text-response-row:last-child {
		border-bottom: none;
	}

	.guest-answer {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
</style>
