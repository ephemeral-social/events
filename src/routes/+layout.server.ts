import { getSession } from '$lib/server/session';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	const tawkWidgetId = platform?.env?.TAWK_WIDGET_ID || '';

	if (!kv) {
		return { user: null, tawkWidgetId };
	}

	const session = await getSession(kv, cookies);
	if (!session) {
		return { user: null, tawkWidgetId };
	}

	return {
		user: {
			userId: session.userId,
			displayName: session.displayName,
			firstName: session.firstName,
			lastName: session.lastName
		},
		tawkWidgetId
	};
};
