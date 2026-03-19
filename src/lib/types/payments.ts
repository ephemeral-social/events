export interface StripeOnboardResponse {
	account_id: string;
}

export interface AccountSessionResponse {
	client_secret: string;
}

export interface StripeStatusResponse {
	onboarded: boolean;
	charges_enabled: boolean;
	payouts_enabled: boolean;
	details_submitted: boolean;
}
