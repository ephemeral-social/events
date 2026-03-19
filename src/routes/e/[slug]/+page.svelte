<script lang="ts">
	import {
		isTombstone,
		getSpotsRemaining,
		isTicketedEvent,
		getShareUrl,
		type PublicEventData,
		type TombstoneData
	} from '$lib/utils/event-helpers';
	import { computeAccentStyle } from '$lib/themes/accent';
	import { getAbsoluteOgImageUrl } from '$lib/utils/og-helpers';
	import type { EventMode, EventAesthetic } from '$lib/themes/types';
	import { THEME_TO_AESTHETIC, DEFAULT_PALETTES, DEFAULT_MODES } from '$lib/themes/types';
	import { getAestheticMetaColor } from '$lib/themes/meta-colors';
	import { formatEventDateShort, formatCountdown } from '$lib/utils/date-format';
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { CurrencyDollar, ArrowRight, CheckCircle, CircleNotch, Ticket, ShieldCheck, EyeSlash } from 'phosphor-svelte';
	import { createEventDetailTimeline, scrollReveal, supportsAmbientEffects } from '$lib/motion';
	import type { Component } from 'svelte';
	import { onMount } from 'svelte';
	import AestheticRouter from '$lib/components/layouts/AestheticRouter.svelte';

	import TombstonePage from '$lib/components/event/TombstonePage.svelte';
	import AuthModal from '$lib/components/auth/AuthModal.svelte';
	import RsvpForm from '$lib/components/rsvp/RsvpForm.svelte';
	import RsvpStatus from '$lib/components/rsvp/RsvpStatus.svelte';
	import RsvpReminderSheet from '$lib/components/rsvp/RsvpReminderSheet.svelte';
	import BottomSheet from '$lib/components/ui/bottom-sheet/BottomSheet.svelte';
	import Confetti from '$lib/motion/components/Confetti.svelte';
	import { toastSuccess } from '$lib/stores/toast.svelte';
	import { hapticLight, hapticSuccess } from '$lib/utils/haptics';
	import CapacityWarning from '$lib/components/rsvp/CapacityWarning.svelte';
	import EventFeed from '$lib/components/event/EventFeed.svelte';
	import GuestList from '$lib/components/guests/GuestList.svelte';
	import TicketPurchase from '$lib/components/tickets/TicketPurchase.svelte';
	import CostSummary from '$lib/components/costs/CostSummary.svelte';
	import SharePanel from '$lib/components/share/SharePanel.svelte';
	import TextBlastForm from '$lib/components/dashboard/TextBlastForm.svelte';
	import CheckinLinkCard from '$lib/components/tickets/CheckinLinkCard.svelte';
	import HostGuestManager from '$lib/components/guests/HostGuestManager.svelte';
	import InviteForm from '$lib/components/guests/InviteForm.svelte';
	import PendingInviteBanner from '$lib/components/guests/PendingInviteBanner.svelte';
	import SurveyForm from '$lib/components/survey/SurveyForm.svelte';
	import SurveyDialog from '$lib/components/survey/SurveyDialog.svelte';
	import type { SurveyQuestion, SurveyResponse, ResponsePayload } from '$lib/types/survey';
	import { ClipboardText, CaretRight } from 'phosphor-svelte';

	let { data } = $props();

	const eventData = $derived(data.eventData);
	const isTomb = $derived(isTombstone(eventData));
	const isAuthenticated = $derived(data.isAuthenticated ?? false);

	// Computed meta for top-level svelte:head
	const pageTitle = $derived(
		isTomb
			? `${(eventData as TombstoneData).title} — Ephemeral`
			: `${(eventData as PublicEventData).event.title} — Ephemeral`
	);
	const pageDescription = $derived.by(() => {
		if (isTomb) return 'This event has been deleted.';
		const ed = eventData as PublicEventData;
		if (ed.event.description) {
			return ed.event.description.slice(0, 155) + (ed.event.description.length > 155 ? '...' : '');
		}
		const hostName = ed.host?.display_name || ed.host?.username || 'Someone';
		return `${formatEventDateShort(ed.event.start_time, ed.event.timezone)} - Hosted by ${hostName}`;
	});
	const ogImage = $derived.by(() => {
		if (isTomb) return null;
		return getAbsoluteOgImageUrl((eventData as PublicEventData).event.slug);
	});
	const ogUrl = $derived(
		isTomb ? null : `https://ephemeralsocial.com/e/${(eventData as PublicEventData).event.slug}`
	);

	let showAuth = $state(false);
	let authProxyRef: HTMLInputElement | undefined = $state();
	/** RSVP status the user intended before being redirected to auth */
	let pendingRsvpStatus = $state<'going' | 'maybe' | 'declined' | null>(null);
	let myRsvp = $derived(data.myRsvp);
	let localRsvp = $state<{ status: string; display_name: string; plus_ones: number; sms_reminders?: number; sms_blasts?: number } | null>(null);
	let localReminder = $state<{ remind_date: string } | null>(null);
	const currentReminder = $derived(localReminder ?? data.myRsvpReminder);
	let activeSheet = $state<'rsvp' | 'tickets' | 'guests' | 'share' | 'hostSettings' | 'reminder' | null>(null);
	let settingsTab = $state<'general' | 'blast' | 'guests' | 'checkin' | 'invite'>('general');
	let pendingInviteCount = $state(0);
	let confettiTrigger = $state(0);
	let confettiOrigin = $state({ x: 0, y: 0 });
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let rsvpBarRef: HTMLDivElement | undefined = $state();
	let surveyDialogOpen = $state(false);
	let surveySubmitting = $state(false);

	// Compute bottom padding so sheet content clears the RSVP bar.
	let sheetPaddingBottom = $state<string | undefined>(undefined);

	$effect(() => {
		void rsvpScrolled;
		void activeSheet;
		if (!rsvpBarRef || !activeSheet) return;
		requestAnimationFrame(() => {
			if (!rsvpBarRef) return;
			const rect = rsvpBarRef.getBoundingClientRect();
			const fromBottom = window.innerHeight - rect.top + 8;
			sheetPaddingBottom = `${fromBottom}px`;
		});
	});

	const currentRsvp = $derived(localRsvp ?? myRsvp);

	const isRsvpd = $derived((!!currentRsvp && currentRsvp.status !== 'declined') || data.isAdmin);

	const hasUnansweredRequiredSurvey = $derived.by(() => {
		if (isTomb || !isAuthenticated || !currentRsvp || currentRsvp.status !== 'going') return false;
		const questions = (data.surveyQuestions ?? []) as SurveyQuestion[];
		const responses = (data.mySurveyResponses ?? []) as SurveyResponse[];
		const requiredQs = questions.filter(q => q.required);
		if (requiredQs.length === 0) return false;
		return requiredQs.some(q => {
			const r = responses.find(resp => resp.question_id === q.question_id);
			if (!r) return true;
			if (q.question_type === 'short_answer') return !r.response_text?.trim();
			return !r.selected_options?.length;
		});
	});

	const privacyCountdown = $derived.by(() => {
		if (isTomb) return null;
		const stats = (eventData as PublicEventData).privacy_stats;
		return stats.deletion_scheduled ? formatCountdown(stats.deletion_scheduled) : null;
	});

	function handleCtaAction(status: 'going' | 'maybe' | 'declined', e?: MouseEvent) {
		if (isAuthenticated) {
			submitRsvp(status, undefined, e);
		} else {
			pendingRsvpStatus = status;
			authProxyRef?.focus();
			showAuth = true;
		}
	}

	async function fetchPendingInviteCount() {
		if (isTomb) return;
		const ed = eventData as PublicEventData;
		try {
			const res = await fetch(`/api/events/${ed.event.event_id}/invites`);
			if (res.ok) {
				const data = await res.json();
				pendingInviteCount = data.pending_sms_count || 0;
			}
		} catch {
			// Non-critical
		}
	}

	async function submitRsvp(
		status: 'going' | 'maybe' | 'declined',
		opts?: { plus_ones?: number; sms_reminders?: boolean; sms_blasts?: boolean },
		e?: MouseEvent
	) {
		if (isTomb) return;
		const ed = eventData as PublicEventData;
		const displayName = currentRsvp?.display_name || data.displayName || '';

		const payload = {
			status,
			display_name: displayName,
			plus_ones: opts?.plus_ones ?? currentRsvp?.plus_ones ?? 0,
			sms_reminders: (opts?.sms_reminders ?? Boolean(currentRsvp?.sms_reminders ?? 0)) ? 1 : 0,
			sms_blasts: (opts?.sms_blasts ?? Boolean(currentRsvp?.sms_blasts ?? 0)) ? 1 : 0,
			first_name: data.firstName ?? undefined,
			last_name: data.lastName ?? undefined
		};

		const isUpdate = !!currentRsvp;
		const method = isUpdate ? 'PUT' : 'POST';

		// Optimistic update
		localRsvp = {
			status,
			display_name: displayName,
			plus_ones: payload.plus_ones,
			sms_reminders: payload.sms_reminders,
			sms_blasts: payload.sms_blasts
		};
		// Haptic + toast
		hapticSuccess();
		if (status === 'going') {
			toastSuccess("You're going!");
			if (e) {
				const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
				confettiOrigin = { x: rect.left + rect.width / 2, y: rect.top };
			} else {
				// Layout RSVP button (no MouseEvent) — confetti from center-bottom
				confettiOrigin = { x: window.innerWidth / 2, y: window.innerHeight * 0.85 };
			}
			if (eventAesthetic === 'fun') {
				confettiTrigger++;
			}
		} else if (status === 'maybe') {
			toastSuccess("RSVP'd as maybe");
		} else {
			toastSuccess("Can't make it");
		}

		// Open sheet for non-declined
		if (status !== 'declined') {
			activeSheet = 'rsvp';
		}

		try {
			let res = await fetch(`/api/events/${ed.event.event_id}/rsvp`, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			// If POST fails with "already", fall back to PUT
			if (!isUpdate && res.status === 400) {
				const errData = (await res.json()) as { error?: string };
				if (errData.error?.toLowerCase().includes('already')) {
					res = await fetch(`/api/events/${ed.event.event_id}/rsvp`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(payload)
					});
				}
			}

			if (res.ok) {
				const resData = (await res.json()) as { status?: string; display_name?: string; plus_ones?: number };
				localRsvp = {
					...localRsvp!,
					status: resData.status || status,
					display_name: resData.display_name || displayName,
					plus_ones: resData.plus_ones ?? payload.plus_ones
				};
			}
			await invalidateAll();
		} catch {
			// Network error — optimistic state stays, user can retry
		}
	}

	async function handleSurveySubmit(responses: ResponsePayload[]) {
		if (isTomb) return;
		const ed = eventData as PublicEventData;
		surveySubmitting = true;
		try {
			const res = await fetch(`/api/events/${ed.event.event_id}/survey/responses`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ responses })
			});
			if (res.ok) {
				toastSuccess('Survey answers submitted!');
				hapticSuccess();
				await invalidateAll();
			}
		} catch {
			// silent
		} finally {
			surveySubmitting = false;
		}
	}

	function handleSheetStatusChange(status: 'going' | 'maybe' | 'declined') {
		hapticLight();
		if (status === 'declined') {
			activeSheet = null;
		}
		submitRsvp(status);
	}

	function handleSheetOptionsChange(opts: { plus_ones: number; sms_reminders: boolean; sms_blasts: boolean }) {
		if (!currentRsvp) return;
		// Update optimistic state immediately
		localRsvp = {
			...currentRsvp,
			plus_ones: opts.plus_ones,
			sms_reminders: opts.sms_reminders ? 1 : 0,
			sms_blasts: opts.sms_blasts ? 1 : 0
		};

		// Debounce PUT
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(async () => {
			if (isTomb) return;
			const ed = eventData as PublicEventData;
			try {
				const res = await fetch(`/api/events/${ed.event.event_id}/rsvp`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						status: currentRsvp!.status,
						display_name: currentRsvp!.display_name,
						plus_ones: opts.plus_ones,
						sms_reminders: opts.sms_reminders ? 1 : 0,
						sms_blasts: opts.sms_blasts ? 1 : 0
					})
				});
				if (res.ok) {
					toastSuccess('RSVP updated');
				}
			} catch {
				// silent
			}
		}, 400);
	}

	function handleEditRsvp() {
		activeSheet = 'rsvp';
	}

	function handleDoneRsvp() {
		handleRsvpSheetClose();
	}

	// Track whether we've auto-shown the tickets sheet after RSVP
	let hasAutoShownTickets = $state(false);

	function handleRsvpSheetClose() {
		activeSheet = null;

		// Auto-open tickets sheet once after RSVP on a ticketed event without tickets
		if (
			!hasAutoShownTickets &&
			!isTomb &&
			isRsvpd &&
			!hasTickets &&
			!data.isHost &&
			data.ticketingReady
		) {
			const ed = eventData as PublicEventData;
			if (isTicketedEvent(ed.event)) {
				hasAutoShownTickets = true;
				// Small delay so the RSVP sheet finishes closing before tickets opens
				setTimeout(() => {
					activeSheet = 'tickets';
				}, 350);
			}
		}
	}

	function formatICSDate(iso: string): string {
		return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
	}

	function escapeICS(text: string): string {
		return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
	}

	function downloadCalendar() {
		hapticLight();
		if (isTomb) return;
		const ed = eventData as PublicEventData;
		const ev = ed.event;
		const shareUrl = getShareUrl(data.slug, ev.short_code);

		const start = formatICSDate(ev.start_time);
		const end = ev.end_time
			? formatICSDate(ev.end_time)
			: formatICSDate(new Date(new Date(ev.start_time).getTime() + 2 * 60 * 60 * 1000).toISOString());

		const lines = [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'PRODID:-//Ephemeral//Events//EN',
			'CALSCALE:GREGORIAN',
			'METHOD:PUBLISH',
			'BEGIN:VEVENT',
			`UID:${ev.event_id}@ephemeral.app`,
			`DTSTART:${start}`,
			`DTEND:${end}`,
			`SUMMARY:${escapeICS(ev.title)}`
		];

		if (ev.description) {
			lines.push(`DESCRIPTION:${escapeICS(ev.description)}`);
		}

		const location = !ev.location_hidden && ev.venue_name
			? ev.venue_address
				? `${ev.venue_name}, ${ev.venue_address}`
				: ev.venue_name
			: undefined;
		if (location) {
			lines.push(`LOCATION:${escapeICS(location)}`);
		}

		const hostName = ed.host?.display_name;
		if (hostName) {
			lines.push(`ORGANIZER;CN=${escapeICS(hostName)}:MAILTO:noreply@ephemeral.app`);
		}

		lines.push(`URL:${shareUrl}`);
		lines.push('END:VEVENT');
		lines.push('END:VCALENDAR');

		const icsContent = lines.join('\r\n');
		const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${ev.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function formatReminderDate(dateStr: string): string {
		const d = new Date(dateStr + 'T00:00:00');
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	async function handleAuthenticated() {
		showAuth = false;
		await invalidateAll();
		// Auto-submit the RSVP the user intended before auth redirected them
		if (pendingRsvpStatus) {
			const status = pendingRsvpStatus;
			pendingRsvpStatus = null;
			submitRsvp(status);
		}
	}

	// Check if user has purchased tickets (for ticketed events)
	let hasTickets = $state(false);
	$effect(() => {
		if (isTomb || !isRsvpd) return;
		const ed = eventData as PublicEventData;
		if (!isTicketedEvent(ed.event) || !isAuthenticated) return;
		fetch(`/api/events/${ed.event.event_id}/tickets`)
			.then((res) => res.ok ? res.json() as Promise<{ tickets?: { ticket_id: string }[] }> : null)
			.then((data) => { hasTickets = (data?.tickets?.length ?? 0) > 0; })
			.catch(() => {});
	});

	// ── Aesthetic System ───────────────────────────────────────────────
	// Derive aesthetic/palette/mode from event data, with legacy theme fallback
	const eventAesthetic = $derived.by((): EventAesthetic => {
		if (isTomb) return 'fun';
		const ev = (eventData as PublicEventData).event;
		if (ev.aesthetic) return ev.aesthetic as EventAesthetic;
		// Legacy theme fallback
		if (ev.theme && ev.theme in THEME_TO_AESTHETIC) {
			return THEME_TO_AESTHETIC[ev.theme].aesthetic;
		}
		return 'fun';
	});

	const eventPalette = $derived.by((): string => {
		if (isTomb) return 'party';
		const ev = (eventData as PublicEventData).event;
		if (ev.palette) return ev.palette;
		// Legacy theme fallback
		if (ev.theme && ev.theme in THEME_TO_AESTHETIC) {
			return THEME_TO_AESTHETIC[ev.theme].palette;
		}
		return DEFAULT_PALETTES[eventAesthetic];
	});

	const eventMode = $derived.by((): EventMode => {
		if (isTomb) return 'dark';
		const ev = (eventData as PublicEventData).event;
		if (ev.mode === 'light' || ev.mode === 'dark') return ev.mode;
		return DEFAULT_MODES[eventAesthetic];
	});

	// Legacy theme for backwards compat (still used by some components)
	const eventTheme = $derived(
		isTomb ? 'forest' : ((eventData as PublicEventData).event.theme ?? 'forest')
	);

	const accentHue = $derived(
		isTomb ? null : ((eventData as PublicEventData).event.accent_hue ?? null)
	);
	const accentStyle = $derived(computeAccentStyle(accentHue, eventMode, eventAesthetic));

	// Meta color for browser chrome
	const metaColor = $derived.by(() => {
		if (isTomb) return '#111110';
		// Try aesthetic-based first, fall back to legacy theme-based
		return getAestheticMetaColor(eventAesthetic, eventPalette, eventMode);
	});

	// Set aesthetic data attributes on <html> so CSS custom properties respond
	$effect(() => {
		if (isTomb) return;
		const el = document.documentElement;

		// New aesthetic system
		if (el.getAttribute('data-aesthetic') !== eventAesthetic) el.setAttribute('data-aesthetic', eventAesthetic);
		if (el.getAttribute('data-palette') !== eventPalette) el.setAttribute('data-palette', eventPalette);
		if (el.getAttribute('data-mode') !== eventMode) el.setAttribute('data-mode', eventMode);

		// Keep legacy data-theme for backwards compat (old components still reference it)
		if (el.getAttribute('data-theme') !== eventTheme) el.setAttribute('data-theme', eventTheme);

		// Apply accent overrides (strip previous accent vars first, then add new ones)
		const existingStyle = (el.getAttribute('style') || '')
			.replace(/--primary:[^;]+;/g, '')
			.replace(/--primary-foreground:[^;]+;/g, '')
			.replace(/--ring:[^;]+;/g, '')
			.trim();
		const combined = accentStyle ? [existingStyle, accentStyle].filter(Boolean).join(' ') : existingStyle;
		if (combined) el.setAttribute('style', combined);
		else el.removeAttribute('style');

		return () => {
			el.removeAttribute('data-aesthetic');
			el.removeAttribute('data-palette');
			el.removeAttribute('data-theme');
			el.removeAttribute('data-mode');
			const style = (el.getAttribute('style') || '')
				.replace(/--primary:[^;]+;/g, '')
				.replace(/--primary-foreground:[^;]+;/g, '')
				.replace(/--ring:[^;]+;/g, '')
				.trim();
			if (style) el.setAttribute('style', style);
			else el.removeAttribute('style');
		};
	});

	// Ambient canvas — only for Fun aesthetic
	let CanvasAmbient: Component<{ theme?: string; class?: string; zIndex?: number; opacity?: number }> | null = $state(null);

	onMount(() => {
		if (isTomb) return;

		// Auto-open invite tab when redirected from event creation with ?invite=1
		if (data.isHost && $page.url.searchParams.has('invite')) {
			settingsTab = 'invite';
			activeSheet = 'hostSettings';
			// Remove query param from URL
			history.replaceState({}, '', $page.url.pathname);
			// Fetch pending invite count
			fetchPendingInviteCount();
		}

		if (eventAesthetic !== 'fun') return;
		try {
			if (supportsAmbientEffects()) {
				import('$lib/motion/components/CanvasAmbient.svelte')
					.then((mod) => {
						CanvasAmbient = mod.default as unknown as Component<{
							theme?: string;
							class?: string;
							zIndex?: number;
							opacity?: number;
						}>;
					})
					.catch(() => {});
			}
		} catch {
			// Ambient canvas is non-critical — fail silently
		}
	});

	// Event detail entrance timeline (cover fade + title slide + info stagger + CTA spring)
	// Uses onMount (not $effect) — this must only run once. Using $effect would re-trigger
	// on reactive dep changes, snapping elements back to opacity:0 and causing a blank screen.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let entranceTl: any = null;
	onMount(() => {
		if (isTomb) return;

		entranceTl = createEventDetailTimeline({
			cover: document.querySelector('[data-animate="cover"]'),
			title: document.querySelector('[data-animate="title"]'),
			infoItems: document.querySelectorAll('[data-animate="info-item"]'),
			ctaButtons: document.querySelector('[data-animate="cta"]')
		});

		return () => {
			entranceTl?.stop();
		};
	});

	// Sticky RSVP — add frosted bg when scrolled
	let rsvpScrolled = $state(false);
	$effect(() => {
		if (isTomb) return;
		const scroller = document.getElementById('scroll-root');
		if (!scroller) return;
		function onScroll() {
			rsvpScrolled = scroller!.scrollTop > 10;
		}
		scroller.addEventListener('scroll', onScroll, { passive: true });
		return () => scroller!.removeEventListener('scroll', onScroll);
	});

	// Layout RSVP handler — wraps handleCtaAction for layout callback signature
	function handleLayoutRsvp(status: string) {
		handleCtaAction(status as 'going' | 'maybe' | 'declined');
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	{#if ogUrl}
		<meta property="og:title" content={pageTitle} />
		<meta property="og:description" content={pageDescription} />
		<meta property="og:type" content="website" />
		<meta property="og:url" content={ogUrl} />
		<meta property="og:site_name" content="Ephemeral" />
		<meta property="og:locale" content="en_US" />
	{/if}
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:image:type" content="image/png" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={pageTitle} />
		<meta name="twitter:description" content={pageDescription} />
		<meta name="twitter:image" content={ogImage} />
	{/if}
	{#if !isTomb}
		<meta name="theme-color" content={metaColor} />
		<!-- Conditional font loading per aesthetic -->
		{#if eventAesthetic === 'simple'}
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
			<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
		{:else if eventAesthetic === 'warm'}
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
			<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet" />
		{:else if eventAesthetic === 'elegant'}
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
			<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300&family=Raleway:wght@300;400;500;600&display=swap" rel="stylesheet" />
		{/if}
		<!-- Fun uses Manrope, already loaded globally in app.html -->
	{/if}
</svelte:head>

{#if isTomb}
	<TombstonePage data={eventData as TombstoneData} />
{:else}
	{@const ed = eventData as PublicEventData}
	{@const spotsLeft = getSpotsRemaining(ed.event, ed.rsvp_counts)}

	<div
		class="min-h-screen"
		data-aesthetic={eventAesthetic}
		data-palette={eventPalette}
		data-mode={eventMode}
		data-theme={eventTheme}
		style={accentStyle || undefined}
	>
	<!-- Ambient particles — Fun aesthetic only, over hero image, under main content -->
	{#if CanvasAmbient && eventAesthetic === 'fun'}
		<svelte:boundary onerror={() => { CanvasAmbient = null; }}>
			<CanvasAmbient theme={eventTheme} zIndex={1} opacity={0.5} />
		</svelte:boundary>
	{/if}

	<!-- Aesthetic-driven layout: hero, title, info, description, RSVP buttons -->
	<AestheticRouter
		aesthetic={eventAesthetic}
		event={ed.event}
		host={ed.host}
		rsvpCounts={ed.rsvp_counts}
		showRsvpBar={!currentRsvp && !data.isHost}
		{rsvpScrolled}
		onRsvp={handleLayoutRsvp}
		onViewGuests={(ed.event.show_guest_list || data.isHost || data.isAdmin) ? () => { hapticLight(); activeSheet = 'guests'; } : undefined}
		onShare={() => { hapticLight(); activeSheet = 'share'; }}
		onDownloadCalendar={downloadCalendar}
	>
		{#snippet ctaSlot()}
			{#if !data.isHost && !currentRsvp}
				{#if currentReminder}
					<p class="mx-auto text-center text-[0.65rem] text-[var(--text-muted)]/70 mt-2">
						Reminder set for {formatReminderDate(currentReminder.remind_date)}
					</p>
				{:else}
					<div class="text-center mt-2">
						<button
							class="mx-auto border-none bg-transparent p-0 text-[0.65rem] text-[var(--text-muted)]/70 underline underline-offset-2 transition-colors duration-150 hover:text-[var(--text-secondary)] cursor-pointer"
							onclick={() => {
								if (isAuthenticated) {
									hapticLight();
									activeSheet = 'reminder';
								} else {
									authProxyRef?.focus();
									showAuth = true;
								}
							}}
						>
							Remind me to RSVP later
						</button>
					</div>
				{/if}
			{/if}
		{/snippet}
	</AestheticRouter>

	<!-- Additional content sections below the layout -->
	<main
		class="relative z-10 mx-auto w-full max-w-lg px-4 space-y-6 pb-28"
		style="isolation: isolate"
	>
		{#if spotsLeft !== null}
			<CapacityWarning {spotsLeft} />
		{/if}

		<!-- Ticketing setup banners -->
		{#if $page.url.searchParams.get('ticketing') === 'ready'}
			<div
				class="flex items-center gap-3 rounded-xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 p-4"
			>
				<CheckCircle size={24} weight="duotone" class="text-[var(--accent-primary)] shrink-0" />
				<p class="text-body-sm text-[var(--text-primary)]">
					Ticketing setup complete! Guests can now purchase tickets.
				</p>
			</div>
		{/if}

		{#if data.needsTicketingSetup}
			{#if data.ticketingPending}
				<div
					class="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4"
				>
					<CircleNotch size={24} weight="bold" class="animate-spin text-[var(--accent-primary)] shrink-0" />
					<div>
						<p class="text-label-sm font-medium text-[var(--text-primary)]">Stripe verification in progress</p>
						<p class="text-caption text-[var(--text-secondary)]">This usually takes a few minutes. Refresh the page to check status.</p>
					</div>
				</div>
			{:else}
				<a
					href="/e/{data.slug}/setup-ticketing"
					class="flex items-center justify-between rounded-xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 p-4 transition-colors hover:bg-[var(--accent-primary)]/15"
				>
					<div class="flex items-center gap-3">
						<CurrencyDollar size={24} weight="duotone" class="text-[var(--accent-primary)] shrink-0" />
						<div>
							<p class="text-label-sm font-medium text-[var(--text-primary)]">Complete ticketing setup</p>
							<p class="text-caption text-[var(--text-secondary)]">Set up Stripe to start selling tickets</p>
						</div>
					</div>
					<ArrowRight size={20} weight="regular" class="text-[var(--accent-primary)] shrink-0" />
				</a>
			{/if}
		{/if}

		<p class="flex items-center justify-center gap-1.5 text-caption text-[var(--text-muted)]">
			<ShieldCheck size={13} weight="duotone" class="text-[var(--accent-primary)]" />
			Privacy {privacyCountdown ? `\u00b7 ${privacyCountdown.text}` : '\u00b7 No data shared'}
		</p>

		{#if currentRsvp || data.isAuthenticated}
			<div use:scrollReveal={{ y: 15 }}>
				<EventFeed eventId={ed.event.event_id} {isRsvpd} />
			</div>
			{#if isRsvpd && !data.isHost && isTicketedEvent(ed.event) && !data.ticketingReady}
				<div class="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4" use:scrollReveal={{ y: 15 }}>
					<CurrencyDollar size={24} weight="duotone" class="text-[var(--text-secondary)] shrink-0" />
					<div>
						<p class="text-label-sm font-medium text-[var(--text-primary)]">Tickets coming soon</p>
						<p class="text-caption text-[var(--text-secondary)]">The host is finalizing payment setup.</p>
					</div>
				</div>
			{/if}
			<div use:scrollReveal={{ y: 15 }}>
				<CostSummary eventId={ed.event.event_id} {isRsvpd} />
			</div>
		{/if}
	</main>

	<!-- Survey reminder banner (above RSVP bar) -->
	{#if hasUnansweredRequiredSurvey}
		<div class="fixed left-0 right-0 z-[45] px-4" style="bottom: calc(80px + max(12px, var(--safe-bottom, 0px)));">
			<div class="mx-auto max-w-lg">
				<button
					onclick={() => { activeSheet = 'rsvp'; }}
					class="w-full flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-overlay)] border border-[var(--border-subtle)] px-4 py-3 transition-all duration-150 hover:border-[var(--accent-primary)]/30"
				>
					<div class="flex items-center gap-2">
						<ClipboardText size={18} weight="regular" class="text-[var(--accent-primary)]" />
						<span class="text-body-sm text-[var(--text-secondary)]">The host has questions for you</span>
					</div>
					<span class="text-label-sm font-medium text-[var(--accent-primary)]">Answer now</span>
				</button>
			</div>
		</div>
	{/if}

	<!-- Fixed action bar — only shows for host or post-RSVP (pre-RSVP handled by layout) -->
	{#if data.isHost || currentRsvp}
		<div
			bind:this={rsvpBarRef}
			class="fixed left-0 right-0 z-50 rsvp-bar-transition"
			class:rsvp-bar-delayed={eventAesthetic !== 'elegant'}
			class:rsvp-bar-frosted={rsvpScrolled}
			class:rsvp-bar-hidden={eventAesthetic === 'elegant' && !rsvpScrolled}
			style="bottom: {rsvpScrolled ? 'max(12px, calc(var(--safe-bottom) + 8px))' : (eventAesthetic === 'elegant' ? '0px' : 'calc(11dvh)')};"
		>
			<div class="mx-auto w-full max-w-lg px-4">
				{#if data.isHost}
					<RsvpStatus
						rsvp={currentRsvp ?? { status: 'going', display_name: '', plus_ones: 0 }}
						isHost={true}
						onEdit={() => goto(`/e/${data.slug}/edit`)}
						onSettings={() => { activeSheet = 'hostSettings'; }}
					/>
				{:else if currentRsvp}
					<RsvpStatus rsvp={currentRsvp} onEdit={handleEditRsvp} onDone={handleDoneRsvp} sheetOpen={activeSheet === 'rsvp'}>
						{#snippet ticketAction()}
							{#if isTicketedEvent(ed.event) && isRsvpd && data.ticketingReady}
								{@const ticketsOpen = activeSheet === 'tickets'}
								<button
									class="rsvp-toggle-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm font-medium transition-all duration-200
										{ticketsOpen ? 'text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)]' : 'text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10'}"
									onclick={() => {
										hapticLight();
										activeSheet = ticketsOpen ? null : 'tickets';
									}}
								>
									{#if ticketsOpen}
										<span class="rsvp-toggle-icon rsvp-toggle-icon-active"><EyeSlash size={14} weight="bold" /></span>
										<span>Hide Tickets</span>
									{:else}
										<Ticket size={14} weight="bold" />
										<span>{hasTickets ? 'View Tickets' : 'Buy Tickets'}</span>
									{/if}
								</button>
							{/if}
						{/snippet}
					</RsvpStatus>
				{/if}
			</div>
		</div>
	{/if}

	<!-- RSVP options bottom sheet (z-40, behind bar at z-50) -->
	{#if currentRsvp}
		<BottomSheet open={activeSheet === 'rsvp'} onClose={handleRsvpSheetClose} zIndex={40} paddingBottom={sheetPaddingBottom}>
			<RsvpForm
				allowPlusOnes={ed.event.allow_plus_ones !== false}
				status={currentRsvp.status as 'going' | 'maybe' | 'declined'}
				plusOnes={currentRsvp.plus_ones ?? 0}
				smsReminders={Boolean(currentRsvp.sms_reminders ?? 0)}
				smsBlasts={Boolean(currentRsvp.sms_blasts ?? 0)}
				onStatusChange={handleSheetStatusChange}
				onOptionsChange={handleSheetOptionsChange}
			/>
			{#if currentRsvp?.status === 'going' && (data.surveyQuestions?.length ?? 0) > 0}
				<div class="mt-4 pt-4 border-t border-[var(--border-subtle)]">
					<SurveyForm
						questions={data.surveyQuestions as SurveyQuestion[]}
						existingResponses={data.mySurveyResponses as SurveyResponse[]}
						onSubmit={handleSurveySubmit}
						submitting={surveySubmitting}
					/>
				</div>
			{/if}
		</BottomSheet>
	{/if}

	<!-- Ticket bottom sheet (z-40, behind bar at z-50) -->
	{#if isTicketedEvent(ed.event) && isRsvpd && data.ticketingReady}
		<BottomSheet open={activeSheet === 'tickets'} onClose={() => (activeSheet = null)} zIndex={40} paddingBottom={sheetPaddingBottom}>
			<TicketPurchase eventId={ed.event.event_id} priceCents={ed.event.ticket_price_cents ?? 0} eventTitle={ed.event.title} stripePublishableKey={data.stripePublishableKey} slug={data.slug} onTicketsConfirmed={() => { hasTickets = true; }} />
		</BottomSheet>
	{/if}

	<!-- Guest list bottom sheet (z-40, behind bar at z-50) -->
	{#if ed.event.show_guest_list || data.isHost || data.isAdmin}
		<BottomSheet open={activeSheet === 'guests'} onClose={() => (activeSheet = null)} zIndex={40} paddingBottom={sheetPaddingBottom}>
			<GuestList eventId={ed.event.event_id} isHost={data.isHost || data.isAdmin} isTicketed={isTicketedEvent(ed.event)} />
		</BottomSheet>
	{/if}

	<!-- Share bottom sheet (z-40, behind bar at z-50) -->
	<BottomSheet open={activeSheet === 'share'} onClose={() => (activeSheet = null)} zIndex={40} paddingBottom={sheetPaddingBottom}>
		<SharePanel slug={data.slug} shortCode={ed.event.short_code} eventId={ed.event.event_id} event={ed.event} />
	</BottomSheet>

	<!-- RSVP Reminder bottom sheet (z-40, behind bar at z-50) -->
	<BottomSheet open={activeSheet === 'reminder'} onClose={() => (activeSheet = null)} zIndex={40} paddingBottom={sheetPaddingBottom}>
		<RsvpReminderSheet
			eventId={ed.event.event_id}
			eventStartTime={ed.event.start_time}
			eventTimezone={ed.event.timezone}
			onComplete={(date) => {
				localReminder = { remind_date: date };
				activeSheet = null;
				hapticSuccess();
				toastSuccess('Reminder set!');
			}}
			onCancel={() => (activeSheet = null)}
		/>
	</BottomSheet>

	<!-- Host Settings bottom sheet (tabbed) -->
	{#if data.isHost}
		<BottomSheet open={activeSheet === 'hostSettings'} onClose={() => (activeSheet = null)} zIndex={40} paddingBottom={sheetPaddingBottom} lockHeight>
			<div class="flex flex-col min-h-full">
				<!-- Tab content -->
				<div class="flex-1">
					{#if settingsTab === 'general'}
						<div class="flex flex-col gap-4 p-1">
							<h3 class="text-label-lg font-serif text-[var(--text-primary)]">Event Settings</h3>
							<button
								type="button"
								onclick={() => { activeSheet = null; setTimeout(() => { surveyDialogOpen = true; }, 200); }}
								class="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 transition-all duration-150 hover:border-[var(--accent-primary)]/30"
							>
								<div class="text-left">
									<p class="text-body-sm font-medium text-[var(--text-primary)]">Guest Survey</p>
									<p class="text-caption text-[var(--text-muted)]">Ask questions when guests RSVP</p>
								</div>
								<CaretRight size={16} weight="bold" class="text-[var(--text-muted)]" />
							</button>
						</div>
					{:else if settingsTab === 'blast'}
						<TextBlastForm eventId={ed.event.event_id} />
					{:else if settingsTab === 'guests'}
						<HostGuestManager eventId={ed.event.event_id} />
					{:else if settingsTab === 'checkin' && isTicketedEvent(ed.event)}
						<CheckinLinkCard eventId={ed.event.event_id} slug={data.slug} />
					{:else if settingsTab === 'invite'}
						<InviteForm eventId={ed.event.event_id} onInvitesSent={() => fetchPendingInviteCount()} />
						{#if pendingInviteCount > 0}
							<div class="mt-4">
								<PendingInviteBanner
									eventId={ed.event.event_id}
									{pendingInviteCount}
									ticketingReady={isTicketedEvent(ed.event) && (data.stripeOnboarded ?? false)}
								/>
							</div>
						{/if}
					{/if}
				</div>

				<!-- Sticky tab bar -->
				<div class="sticky bottom-0 z-10 flex border-t border-[var(--border-subtle)]" style="background: var(--surface-overlay)">
					<button
						class="host-tab flex-1 pt-3 pb-1 text-label-sm font-medium transition-all duration-150 border-t-2 -mt-px
							{settingsTab === 'general' ? 'border-[var(--accent-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}"
						onclick={() => { hapticLight(); settingsTab = 'general'; }}
					>
						General
					</button>
					<button
						class="host-tab flex-1 pt-3 pb-1 text-label-sm font-medium transition-all duration-150 border-t-2 -mt-px
							{settingsTab === 'invite' ? 'border-[var(--accent-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}"
						onclick={() => { hapticLight(); settingsTab = 'invite'; fetchPendingInviteCount(); }}
					>
						Invite
					</button>
					<button
						class="host-tab flex-1 pt-3 pb-1 text-label-sm font-medium transition-all duration-150 border-t-2 -mt-px
							{settingsTab === 'blast' ? 'border-[var(--accent-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}"
						onclick={() => { hapticLight(); settingsTab = 'blast'; }}
					>
						Text Blast
					</button>
					<button
						class="host-tab flex-1 pt-3 pb-1 text-label-sm font-medium transition-all duration-150 border-t-2 -mt-px
							{settingsTab === 'guests' ? 'border-[var(--accent-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}"
						onclick={() => { hapticLight(); settingsTab = 'guests'; }}
					>
						Guests
					</button>
					{#if isTicketedEvent(ed.event)}
						<button
							class="host-tab flex-1 pt-3 pb-1 text-label-sm font-medium transition-all duration-150 border-t-2 -mt-px
								{settingsTab === 'checkin' ? 'border-[var(--accent-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}"
							onclick={() => { hapticLight(); settingsTab = 'checkin'; }}
						>
							Check-in
						</button>
					{/if}
				</div>
			</div>
		</BottomSheet>
	{/if}

	<!-- Confetti burst (Fun aesthetic only) -->
	{#if eventAesthetic === 'fun'}
		<Confetti trigger={confettiTrigger} origin={confettiOrigin} />
	{/if}

	<!-- AuthModal OUTSIDE main to avoid stacking context issues -->
	<AuthModal
		open={showAuth}
		onClose={() => (showAuth = false)}
		onAuthenticated={handleAuthenticated}
		bind:proxyRef={authProxyRef}
	/>

	{#if !isTomb && data.isHost}
		<SurveyDialog
			open={surveyDialogOpen}
			eventId={ed.event.event_id}
			isHost={true}
			onClose={() => { surveyDialogOpen = false; }}
		/>
	{/if}
	</div>
{/if}

<style>
	.rsvp-bar-transition {
		transition: bottom 0.35s cubic-bezier(0.25, 0.1, 0.25, 1),
			transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1),
			opacity 0.35s ease,
			background 0.3s ease,
			backdrop-filter 0.3s ease;
	}
	.rsvp-bar-delayed {
		opacity: 0;
		transform: translateY(12px);
		animation: rsvpDelayedIn 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) 1s forwards;
	}

	@keyframes rsvpDelayedIn {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.rsvp-bar-frosted {
		background: color-mix(in srgb, var(--surface-base) 80%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
	}

	/* Elegant: bar hidden below viewport, slides up on scroll */
	.rsvp-bar-hidden {
		transform: translateY(calc(100% + 20px));
		opacity: 0;
		pointer-events: none;
	}

	/* Reuse toggle animation for ticket action snippet */
	.rsvp-toggle-btn {
		position: relative;
		overflow: hidden;
	}

	.rsvp-toggle-icon {
		display: flex;
		transition: transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.rsvp-toggle-icon-active {
		animation: rsvp-icon-pop 300ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	@keyframes rsvp-icon-pop {
		0% {
			transform: scale(0.5) rotate(-90deg);
			opacity: 0;
		}
		60% {
			transform: scale(1.15) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
	}
</style>
