interface CacheEntry {
	userId: string;
	timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const TTL = 30000; // 30 seconds

export function getCachedUserId(refreshToken: string): string | null {
	const entry = cache.get(refreshToken);
	if (!entry) return null;

	if (Date.now() - entry.timestamp > TTL) {
		cache.delete(refreshToken);
		return null;
	}

	return entry.userId;
}

export function setCachedUserId(refreshToken: string, userId: string): void {
	cache.set(refreshToken, {
		userId,
		timestamp: Date.now(),
	});
}

export function deleteCachedUserId(refreshToken: string): void {
	cache.delete(refreshToken);
}

export function clearSessionCache(): void {
	cache.clear();
}