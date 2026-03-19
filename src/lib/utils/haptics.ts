import { isIOS } from './platform';

export async function hapticLight() {
	if (typeof navigator === 'undefined') return;
	if ('vibrate' in navigator) {
		navigator.vibrate(10);
	} else if (isIOS()) {
		try {
			const { haptic } = await import('ios-haptics');
			haptic();
		} catch {
			/* iOS <18 or not supported */
		}
	}
}

export async function hapticSuccess() {
	if (typeof navigator === 'undefined') return;
	if ('vibrate' in navigator) {
		navigator.vibrate([10, 50, 20]);
	} else if (isIOS()) {
		try {
			const { haptic } = await import('ios-haptics');
			haptic.confirm();
		} catch {
			/* iOS <18 or not supported */
		}
	}
}

export async function hapticError() {
	if (typeof navigator === 'undefined') return;
	if ('vibrate' in navigator) {
		navigator.vibrate([30, 50, 30, 50, 30]);
	} else if (isIOS()) {
		try {
			const { haptic } = await import('ios-haptics');
			haptic.error();
		} catch {
			/* iOS <18 or not supported */
		}
	}
}
