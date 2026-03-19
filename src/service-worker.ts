/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

// Cache version auto-derived from SvelteKit build hash
const CACHE_NAME = `ephemeral-${version}`;

// Assets to precache: built app + static files
const ASSETS = [...build, ...files];

// Install: precache all assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => self.skipWaiting())
	);
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
			)
			.then(() => self.clients.claim())
	);
});

// Fetch: cache-first for static assets, network-first for everything else
self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	// Skip non-http(s) requests
	if (!url.protocol.startsWith('http')) return;

	// Static assets: cache-first
	if (ASSETS.includes(url.pathname)) {
		event.respondWith(
			caches.match(event.request).then((cached) => cached || fetch(event.request))
		);
		return;
	}

	// API calls and pages: network-first
	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// Don't cache API responses or non-ok responses
				if (url.pathname.startsWith('/api/') || !response.ok) {
					return response;
				}
				// Cache page navigations
				const clone = response.clone();
				caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
				return response;
			})
			.catch(
				() =>
					caches
						.match(event.request)
						.then((cached) => cached || new Response('Offline', { status: 503 })) as Promise<Response>
			)
	);
});
