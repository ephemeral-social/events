import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * OG image endpoint — redirects to the standalone OG worker.
 * The actual image generation runs on a dedicated Cloudflare Worker
 * (ephemeral-og) which has proper static WASM imports for satori + resvg.
 */
export const GET: RequestHandler = async ({ params, platform }) => {
	const ogWorkerUrl = platform?.env?.OG_WORKER_URL || 'https://ephemeral-og.ephemeralsocial.workers.dev';
	redirect(302, `${ogWorkerUrl}/${encodeURIComponent(params.slug)}`);
};
