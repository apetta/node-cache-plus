import type NodeCache from "@cacheable/node-cache";

export interface CacheItem {
	value: any;
	tags: string[];
}

export type { NodeCache };
