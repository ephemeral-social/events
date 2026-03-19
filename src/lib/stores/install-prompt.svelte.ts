let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
let dismissed = $state(false);

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function getCanInstall(): boolean {
	return deferredPrompt !== null && !dismissed;
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
	return deferredPrompt;
}

export async function promptInstall(): Promise<boolean> {
	if (!deferredPrompt) return false;
	await deferredPrompt.prompt();
	const result = await deferredPrompt.userChoice;
	deferredPrompt = null;
	return result.outcome === 'accepted';
}

export function dismissInstall() {
	dismissed = true;
	try {
		localStorage.setItem('eph-install-dismissed', String(Date.now()));
	} catch {
		// localStorage unavailable
	}
}

export function initInstallPrompt() {
	if (typeof window === 'undefined') return;

	// Check if previously dismissed within 30 days
	try {
		const dismissedAt = localStorage.getItem('eph-install-dismissed');
		if (dismissedAt) {
			const elapsed = Date.now() - Number(dismissedAt);
			if (elapsed < 30 * 24 * 60 * 60 * 1000) {
				dismissed = true;
			}
		}
	} catch {
		// localStorage unavailable
	}

	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		deferredPrompt = e as BeforeInstallPromptEvent;
	});
}
