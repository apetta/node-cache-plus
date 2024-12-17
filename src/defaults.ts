import type { Options as NodeCacheOptions } from "node-cache";
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
 * If not configured yet, configures it with default options.
 */
export function getDefaultCache(): Cache {
	if (!defaultCache) {
		defaultCache = new Cache();
	}
	return defaultCache;
}
