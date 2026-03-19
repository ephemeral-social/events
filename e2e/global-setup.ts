import { backendHealthCheck, clearRateLimits } from './fixtures/backend-api';

async function globalSetup() {
	// Clear rate limits
	clearRateLimits();

	// Health check backend
	const healthy = await backendHealthCheck();
	if (!healthy) {
		throw new Error(
			'Cannot reach backend at http://127.0.0.1:8787. Start with: cd ../ephemeral_backend && npx wrangler dev'
		);
	}

	console.log('Global setup: backend is healthy, rate limits cleared');
}

export default globalSetup;
