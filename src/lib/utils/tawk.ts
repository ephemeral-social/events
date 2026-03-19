/**
 * Safely open the tawk.to chat widget.
 *
 * Must call showWidget() before maximize() — calling maximize on a
 * hidden widget causes tawk.to to append #max-widget to the URL and
 * can freeze the page in SPA routers.
 */
export function openTawkChat(): void {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const api = (globalThis as any).Tawk_API;
	if (!api) return;

	if (typeof api.showWidget === 'function') {
		api.showWidget();
		api.maximize();
	} else {
		// Widget hasn't loaded yet — defer until onLoad fires
		const existingOnLoad = api.onLoad;
		api.onLoad = function () {
			if (typeof existingOnLoad === 'function') existingOnLoad();
			api.showWidget();
			api.maximize();
		};
	}
}
