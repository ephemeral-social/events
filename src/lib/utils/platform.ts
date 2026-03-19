/**
 * Platform detection — feature-based, not UA sniffing.
 */

export function isIOS(): boolean {
	if (typeof navigator === 'undefined') return false;
	return (
		/iPad|iPhone|iPod/.test(navigator.userAgent) ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
	);
}

export function isAndroid(): boolean {
	if (typeof navigator === 'undefined') return false;
	return /Android/.test(navigator.userAgent);
}

export function isStandalone(): boolean {
	if (typeof window === 'undefined') return false;
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
	);
}

export function isChromeAndroid(): boolean {
	if (typeof navigator === 'undefined') return false;
	return /Android/.test(navigator.userAgent) && /Chrome/.test(navigator.userAgent);
}

export function supportsVibration(): boolean {
	if (typeof navigator === 'undefined') return false;
	return 'vibrate' in navigator;
}

export function supportsBadge(): boolean {
	if (typeof navigator === 'undefined') return false;
	return 'setAppBadge' in navigator;
}

export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
