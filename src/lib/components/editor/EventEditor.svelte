<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AestheticRouter from '$lib/components/layouts/AestheticRouter.svelte';
	import EditorToolbar from './EditorToolbar.svelte';
	import { getDraft, resetDraft, initFromEvent, updateDraft, uploadCover } from '$lib/stores/event-draft.svelte';
	import type { EventDraft } from '$lib/stores/event-draft.svelte';
	import { computeAccentStyle } from '$lib/themes/accent';

	interface Props {
		mode: 'create' | 'edit';
		event?: Record<string, unknown>;
		slug?: string;
	}

	let { mode, event, slug }: Props = $props();

	const draft = $derived(getDraft());
	const accentStyle = $derived(computeAccentStyle(draft.accent_hue, draft.mode, draft.aesthetic));

	function handleCancel() {
		goto(slug ? `/e/${slug}` : '/');
	}

	function handleFieldUpdate(field: string, value: any) {
		updateDraft(field as keyof EventDraft, value);
	}

	function handleUploadCover(file: File) {
		uploadCover(file);
	}

	onMount(() => {
		if (mode === 'create') resetDraft();
		else if (event) initFromEvent(event);
	});
</script>

<div
	class="event-editor"
	data-aesthetic={draft.aesthetic}
	data-palette={draft.palette}
	data-mode={draft.mode}
	style={accentStyle || undefined}
	data-testid="event-editor"
>
	<AestheticRouter
		aesthetic={draft.aesthetic}
		event={{
			title: draft.title || 'Untitled Event',
			description: draft.description,
			venue_name: draft.venue_name,
			venue_address: draft.venue_address,
			start_time: draft.start_time,
			end_time: draft.end_time,
			subtitle: draft.subtitle,
			cover_r2_key: draft.cover_key,
			cover_preview_url: draft.cover_preview_url,
			cover_is_video: draft.cover_is_video,
			link_url: draft.link_url,
			link_title: draft.link_title,
			inspo_urls: draft.inspo_urls
		}}
		host={null}
		rsvpCounts={{ going: 0, maybe: 0 }}
		editMode={true}
		showRsvpBar={false}
		onUpdateField={handleFieldUpdate}
		onUploadCover={handleUploadCover}
	/>
	<EditorToolbar {mode} onCancel={handleCancel} />
</div>

<style>
	.event-editor {
		position: relative;
		min-height: 100vh;
		padding-bottom: 140px;
	}
</style>
