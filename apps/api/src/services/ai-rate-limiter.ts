const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const requestsByUser = new Map<string, number[]>();

export function assertAiRateLimit(userId: string, now = Date.now()) {
	const windowStart = now - WINDOW_MS;
	const recentRequests = (requestsByUser.get(userId) ?? []).filter(
		(timestamp) => timestamp > windowStart,
	);

	if (recentRequests.length >= MAX_REQUESTS) {
		throw new Error("AI request limit reached. Please try again in a minute.");
	}

	recentRequests.push(now);
	requestsByUser.set(userId, recentRequests);
}

export function resetAiRateLimits() {
	requestsByUser.clear();
}
