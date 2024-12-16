import { getDefaultCache } from "./defaults";
import type { CacheFunctionOptions } from "./types";
import crypto from "node:crypto";
import type { Cache } from "./Cache";

function defaultKeyGenerator(fnName: string, args: any[]): string {
	const hash = crypto
		.createHash("sha1")
		.update(JSON.stringify(args))
		.digest("hex");
	return `${fnName}:${hash}`;
}

/**
 * `cachedCall` executes the given async function and caches its result for subsequent calls.
 * You can provide `options` for TTL, tags, custom key, key generator, or a custom cache instance.
 *
 * Usage:
 * const data = await cachedCall(fetchData, { ttl: 600, tags: ["users"] }, 123);
 *
 * @param fn - The async function to call if not cached.
 * @param options - Optional caching parameters.
 * @param fnArgs - Arguments to pass into the async function.
 */
export async function cachedCall<T, A extends any[]>(
	fn: (...args: A) => Promise<T>,
	options: CacheFunctionOptions = {},
	...fnArgs: A
): Promise<T> {
	const {
		ttl,
		tags,
		key,
		keyGenerator = defaultKeyGenerator,
		cacheInstance,
	} = options;

	const cache = cacheInstance || getDefaultCache();
	const fnName = fn.name || "anonymous_function";
	const cacheKey = key ?? keyGenerator(fnName, fnArgs);

	const cachedData = cache.get<T>(cacheKey);
	if (cachedData !== undefined) {
		return cachedData;
	}

	const freshData = await fn(...fnArgs);
	cache.set(cacheKey, freshData, ttl, tags || []);
	return freshData;
}

/**
 * `withCache` returns a new cached version of the given async function.
 * Subsequent calls with the same arguments will return cached data for the TTL duration.
 *
 * Usage:
 * const cachedFetchData = withCache(fetchData, { ttl: 600, tags: ["users"] });
 * const data = await cachedFetchData(123);
 *
 * @param fn - The async function to wrap.
 * @param options - Optional caching parameters.
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
	fn: T,
	options: CacheFunctionOptions = {},
): T {
	const {
		ttl,
		tags,
		key,
		keyGenerator = defaultKeyGenerator,
		cacheInstance,
	} = options;

	const fnName = fn.name || "anonymous_function";

	const cachedFn = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
		const cache: Cache = cacheInstance || getDefaultCache();
		const cacheKey = key ?? keyGenerator(fnName, args);

		const cachedData = cache.get<ReturnType<T>>(cacheKey);
		if (cachedData !== undefined) {
			return cachedData;
		}

		const freshData = await fn(...args);
		cache.set(cacheKey, freshData, ttl, tags || []);
		return freshData;
	};

	// Preserve function name and length properties
	Object.defineProperties(cachedFn, {
		name: { value: fnName },
		length: { value: fn.length },
	});

	return cachedFn as T;
}
