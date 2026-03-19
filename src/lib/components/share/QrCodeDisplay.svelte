<script lang="ts">
	import { DownloadSimple, QrCode, SpinnerGap } from 'phosphor-svelte';
	import DOMPurify from 'dompurify';
	import QRCode from 'qrcode';
	import { parse, converter } from 'culori';

	interface Props {
		url: string;
		eventTitle?: string;
		size?: number;
	}

	let { url, eventTitle, size = 220 }: Props = $props();

	let qrSvg = $state('');
	let qrError = $state(false);
	let qrLoading = $state(true);

	function sanitizeFilename(title: string): string {
		return title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 50);
	}

	/** Read a CSS custom property from :root and convert to hex */
	function getCssHex(varName: string, fallback: string): string {
		if (typeof document === 'undefined') return fallback;
		const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
		if (!raw) return fallback;
		try {
			const toRgb = converter('rgb');
			const rgb = toRgb(parse(raw));
			if (!rgb) return fallback;
			const h = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0');
			return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`;
		} catch { return fallback; }
	}

	/** Theme-derived QR colors. Re-reads CSS vars each time the effect runs. */
	let qrDark = $state('#1a1918');
	let qrLight = $state('#ede9e3');

	function generateQr(dark: string, light: string) {
		if (!url) return;
		qrLoading = true;
		qrError = false;

		const opts = {
			margin: 2,
			width: 256,
			errorCorrectionLevel: 'Q' as const,
			color: { dark, light }
		};

		QRCode.toString(url, { ...opts, type: 'svg' })
			.then((svg) => {
				qrSvg = svg;
				qrError = false;
				qrLoading = false;
			})
			.catch(() => {
				qrError = true;
				qrLoading = false;
			});
	}

	// Re-generate QR when url changes or theme changes (detected via MutationObserver)
	let themeKey = $state(0);
	$effect(() => {
		const el = document.documentElement;
		const observer = new MutationObserver(() => { themeKey++; });
		observer.observe(el, { attributes: true, attributeFilter: ['data-theme', 'data-mode', 'style'] });
		return () => observer.disconnect();
	});

	$effect(() => {
		// Subscribe to themeKey and url so this re-runs when either changes
		void themeKey;
		if (!url) return;
		qrDark = getCssHex('--surface-raised', '#1a1918');
		qrLight = getCssHex('--text-primary', '#ede9e3');
		generateQr(qrDark, qrLight);
	});

	function downloadSvg() {
		if (!qrSvg) return;
		const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
		const blobUrl = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = blobUrl;
		a.download = `${eventTitle ? sanitizeFilename(eventTitle) : 'event'}-qr.svg`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(blobUrl);
	}

	async function downloadPng() {
		try {
			const dataUrl = await QRCode.toDataURL(url, {
				margin: 2,
				width: 1024,
				errorCorrectionLevel: 'Q' as const,
				color: { dark: qrDark, light: qrLight }
			});
			const a = document.createElement('a');
			a.href = dataUrl;
			a.download = `${eventTitle ? sanitizeFilename(eventTitle) : 'event'}-qr.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} catch {
			// PNG generation failed silently — SVG is still available
		}
	}

	const filenameBase = $derived(eventTitle ? sanitizeFilename(eventTitle) : 'event');
</script>

<div class="flex flex-col items-center gap-3 pt-2">
	{#if qrLoading}
		<div class="flex flex-col items-center gap-2 py-8 text-[var(--text-muted)]">
			<SpinnerGap size={32} weight="regular" class="animate-spin" />
			<p class="text-body-sm">Generating QR code...</p>
		</div>
	{:else if qrError}
		<div class="flex flex-col items-center gap-2 py-8 text-[var(--text-muted)]">
			<QrCode size={48} weight="thin" />
			<p class="text-body-sm">Could not generate QR code</p>
		</div>
	{:else}
		<div
			role="img"
			aria-label="QR code linking to {url}"
			class="rounded-lg bg-[var(--text-primary)] p-4 overflow-hidden [&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
			style:max-width="{size}px"
		>
			{@html DOMPurify.sanitize(qrSvg, {
				USE_PROFILES: { svg: true, svgFilters: true }
			})}
		</div>

		<p class="text-caption text-[var(--text-muted)] text-center break-all max-w-[260px]">{url}</p>

		<div class="flex gap-2">
			<button
				onclick={downloadSvg}
				class="flex items-center gap-1.5 rounded-full bg-[var(--muted)] px-4 py-2 text-label-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--border-default)]"
			>
				<DownloadSimple size={14} weight="bold" />
				SVG
			</button>
			<button
				onclick={downloadPng}
				class="flex items-center gap-1.5 rounded-full bg-[var(--muted)] px-4 py-2 text-label-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--border-default)]"
			>
				<DownloadSimple size={14} weight="bold" />
				PNG
			</button>
		</div>
	{/if}
</div>
