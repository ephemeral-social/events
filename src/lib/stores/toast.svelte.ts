export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
	id: string;
	message: string;
	variant: ToastVariant;
	duration: number;
}

const MAX_TOASTS = 5;
let nextId = 0;

let toasts = $state<ToastItem[]>([]);

export function getToasts(): ToastItem[] {
	return toasts;
}

export function addToast(message: string, variant: ToastVariant = 'info', duration = 3000) {
	const id = `toast-${nextId++}`;
	const toast: ToastItem = { id, message, variant, duration };

	// FIFO eviction if over max
	if (toasts.length >= MAX_TOASTS) {
		toasts = toasts.slice(1);
	}
	toasts = [...toasts, toast];

	// Auto-dismiss
	setTimeout(() => {
		dismissToast(id);
	}, duration);
}

export function dismissToast(id: string) {
	toasts = toasts.filter((t) => t.id !== id);
}

// Convenience helpers
export function toastSuccess(message: string) {
	addToast(message, 'success', 1500);
}

export function toastError(message: string) {
	addToast(message, 'error', 5000);
}
