import type { NodeCacheOptions } from "@cacheable/node-cache";
import { Cache } from "./Cache";

let defaultCache: Cache | null = null;

/**
 * Configures and returns the default Cache instance.
 * If called multiple times, the last call overrides the default.
 */
export function configureDefaultCache(options?: NodeCacheOptions): Cache {
	defaultCache = new Cache(options);
	return defaultCache;
}

/**
 * Gets the currently configured default cache.
 * If not configured yet, configures it with a default TTL of 6 hours.
 */
export function getDefaultCache(): Cache {
	if (!defaultCache) {
		defaultCache = new Cache({ stdTTL: 21600 });
	}
	return defaultCache;
}
