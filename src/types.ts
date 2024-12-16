import type NodeCache from "@cacheable/node-cache";
import type { Cache } from "./Cache";

export interface CacheItem {
	value: any;
	tags: string[];
}

export interface CacheFunctionOptions {
	ttl?: number;
	tags?: string[];
	key?: string;
	keyGenerator?: (fnName: string, args: any[]) => string;
	cacheInstance?: Cache;
}

export type { NodeCache };
