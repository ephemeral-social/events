import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	return {
		waitlistApiUrl: platform?.env?.WAITLIST_API_URL || 'https://ephemeral-waitlist.ephemeralsocial.workers.dev',
		stripeFounderLink: platform?.env?.STRIPE_FOUNDER_LINK || ''
	};
};
