// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			session?: {
				userId: string;
				accessToken: string;
				refreshToken: string;
				displayName?: string;
				firstName?: string;
				lastName?: string;
			};
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				SESSIONS: KVNamespace;
				BACKEND_URL: string;
				STRIPE_PUBLISHABLE_KEY: string;
				DEBUG_TOKEN?: string;
				BEEHIIV_API_KEY?: string;
				BEEHIIV_PUBLICATION_ID?: string;
				HIBP_API_KEY: string;
				PINTEREST_APP_ID: string;
				PINTEREST_APP_SECRET: string;
				ADMIN_USER_ID?: string;
				TAWK_WIDGET_ID?: string;
				OG_WORKER_URL?: string;
				WAITLIST_API_URL?: string;
				STRIPE_FOUNDER_LINK?: string;
			};
		}
	}
}

export {};
