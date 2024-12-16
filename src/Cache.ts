import NodeCache, { type NodeCacheOptions } from "@cacheable/node-cache";
import type { CacheItem } from "./types";

export class Cache extends NodeCache {
	private cache: NodeCache;
	private tagMap: Map<string, Set<string>>;

	constructor(options?: NodeCacheOptions) {
		super();
		this.cache = new NodeCache(options);
		this.tagMap = new Map();
	}

	public override set(
		key: string,
		value: any,
		ttl?: number | string,
		tags: string[] = [],
	): boolean {
		const success = this.cache.set(key, { value, tags }, ttl);
		if (success) {
			for (const tag of tags) {
				let keys = this.tagMap.get(tag);
				if (!keys) {
					keys = new Set();
					this.tagMap.set(tag, keys);
				}
				keys.add(key);
			}
		}
		return success;
	}

	public override get<T>(key: string): T | undefined {
		const item = this.cache.get(key) as CacheItem | undefined;
		return item ? (item.value as T) : undefined;
	}

	public override del(keys: string | string[]): number {
		if (!Array.isArray(keys)) keys = [keys];
		const deletedCount = this.cache.del(keys);
		for (const key of keys) {
			for (const [tag, keySet] of this.tagMap.entries()) {
				if (keySet.delete(key) && keySet.size === 0) {
					this.tagMap.delete(tag);
				}
			}
		}
		return deletedCount;
	}

	public invalidateTag(tag: string): void {
		const keySet = this.tagMap.get(tag);
		if (!keySet) return;
		const keysToDelete = Array.from(keySet);
		this.del(keysToDelete);
	}

	public invalidateTagsIntersection(tags: string[]): void {
		const tagsToInvalidate = tags.filter((tag) => this.tagMap.has(tag));
		if (tagsToInvalidate.length === 0) return;

		let keysIntersection: Set<string> | null = null;
		for (const tag of tagsToInvalidate) {
			const keySet = this.tagMap.get(tag) ?? new Set<string>();
			if (keysIntersection === null) {
				keysIntersection = new Set(keySet);
			} else {
				for (const key of Array.from(keysIntersection)) {
					if (!keySet.has(key)) keysIntersection.delete(key);
				}
			}
			if (keysIntersection.size === 0) break;
		}

		if (keysIntersection && keysIntersection.size > 0) {
			this.del(Array.from(keysIntersection));
		}
	}

	public invalidateTagsUnion(tags: string[]): void {
		const uniqueKeys = new Set<string>();
		for (const tag of tags) {
			const keySet = this.tagMap.get(tag);
			if (keySet) {
				for (const key of keySet) {
					uniqueKeys.add(key);
				}
			}
		}
		if (uniqueKeys.size > 0) {
			this.del(Array.from(uniqueKeys));
		}
	}

	public override flushAll(): void {
		this.cache.flushAll();
		this.tagMap.clear();
	}

	public override keys(): string[] {
		return this.cache.keys();
	}

	public getCacheInstance(): NodeCache {
		return this.cache;
	}
}
