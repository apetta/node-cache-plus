import NodeCache, {
	type Key,
	type Options as NodeCacheOptions,
} from "node-cache";
import type { CacheItem } from "./types";

export class Cache extends NodeCache {
	private readonly tagMap: Map<string, Set<Key>>;

	constructor(options?: NodeCacheOptions) {
		super(options);
		this.tagMap = new Map();
	}

	/**
	 * Sets the value of the specified key.
	 * @param key - Key to set
	 * @param value - Value to set
	 * @param ttl - Time to live in seconds
	 * @param tags - Array of tags to associate with the key
	 * @returns Whether the key was set successfully
	 */
	public override set(
		key: Key,
		value: any,
		ttl?: number | string,
		tags: string[] = [],
	): boolean {
		// biome-ignore lint/style/noNonNullAssertion: NodeCache typings are incorrect
		const success = super.set(key, { value, tags }, ttl!);
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

	/**
	 * Sets multiple key-value pairs in the cache.
	 * @param items - An array of objects containing the following properties:
	 *   - `key` (string): The cache key.
	 *   - `value` (any): The value to store.
	 *   - `ttl` (number | string, optional): The time-to-live for the cache entry, in seconds or a string format.
	 *   - `tags` (string[], optional): An array of tags associated with the key for easy invalidation.
	 *
	 * @returns {boolean[]} An array of booleans indicating whether each key was set successfully.
	 */
	public override mset(
		items: {
			key: Key;
			val: any;
			ttl?: number | string;
			tags?: string[];
		}[],
	): boolean {
		items.map((item) =>
			this.set(item.key, item.val, item.ttl, item.tags ?? []),
		);

		return true;
	}

	/**
	 * Retrieves the value of the specified key.
	 * @param key - Key to retrieve
	 * @returns Value of the key
	 */
	public override get<T>(key: Key): T | undefined {
		const item = super.get(key) as CacheItem | undefined;
		return item ? (item.value as T) : undefined;
	}

	/**
	 * Retrieves the values of the specified keys.
	 * @param keys - Array of keys to retrieve
	 * @returns Array of values
	 */
	public override mget<T>(keys: Key[]): { [key: string]: T } {
		const result: { [key: string]: T } = {};
		for (const key of keys) {
			const value = this.get<T>(key);
			if (value !== undefined) {
				result[key] = value;
			}
		}
		return result;
	}

	/**
	 * Deletes the specified key from the cache.
	 * @param keys - Key or array of keys to delete
	 * @returns Number of keys deleted
	 */
	public override del(keys: Key | Key[]): number {
		if (!Array.isArray(keys)) keys = [keys];
		const deletedCount = super.del(keys);
		for (const key of keys) {
			for (const [tag, keySet] of this.tagMap.entries()) {
				if (keySet.delete(key) && keySet.size === 0) {
					this.tagMap.delete(tag);
				}
			}
		}
		return deletedCount;
	}

	/**
	 * Deletes multiple keys from the cache.
	 * @param keys - Array of keys to delete
	 * @returns Number of keys deleted
	 */
	public mdel(keys: string[]): number {
		return this.del(keys);
	}

	/**
	 * Retrieves the value of the specified key and removes it from the cache.
	 * @param key - Key to take
	 * @returns Value of the key
	 */
	public override take<T>(key: Key): T | undefined {
		const item = super.get(key) as CacheItem | undefined;

		if (item) {
			this.del(key);
			return item.value as T;
		}
	}

	/**
	 * Invalidates all keys that have the specified tag.
	 * @param tag - Tag to invalidate
	 * @returns void
	 * @example
	 * cache.set("key1", "value1", 60, ["tag1"]);
	 * cache.set("key2", "value2", 60, ["tag2"]);
	 * cache.set("key3", "value3", 60, ["tag1", "tag2"]);
	 * cache.invalidateTag("tag1");
	 * // All keys with "tag1" will be invalidated
	 * // In this case, "key1" and "key3" will be invalidated, and "key2" will remain in the cache.
	 * cache.get("key1"); // undefined
	 * cache.get("key2"); // "value2"
	 * cache.get("key3"); // undefined
	 */
	public invalidateTag(tag: string): void {
		const keySet = this.tagMap.get(tag);
		if (!keySet) return;
		const keysToDelete = Array.from(keySet);
		this.del(keysToDelete);
	}

	/**
	 * Invalidates keys that have all of the specified tags.
	 * @param tags - Array of tags to invalidate
	 * @returns void
	 * @example
	 * cache.set("key1", "value1", 60, ["tag1"]);
	 * cache.set("key2", "value2", 60, ["tag2"]);
	 * cache.set("key3", "value3", 60, ["tag1", "tag2"]);
	 * cache.invalidateTagsIntersection(["tag1", "tag2"]);
	 * // Any keys wich contain **both** "tag1" and "tag2" will be invalidated
	 * // In this case, "key3" will be invalidated, and "key1" and "key2" will remain in the cache.
	 * cache.get("key1"); // "value1"
	 * cache.get("key2"); // "value2"
	 * cache.get("key3"); // undefined
	 */
	public invalidateTagsIntersection(tags: string[]): void {
		const tagsToInvalidate = tags.filter((tag) => this.tagMap.has(tag));
		if (tagsToInvalidate.length === 0) return;

		let keysIntersection: Set<Key> | null = null;
		for (const tag of tagsToInvalidate) {
			const keySet = this.tagMap.get(tag) ?? new Set<Key>();
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

	/**
	 * Invalidates all keys that have at least one of the specified tags.
	 * @param tags - Array of tags to invalidate
	 * @returns void
	 * @example
	 * cache.set("key1", "value1", 60, ["tag1"]);
	 * cache.set("key2", "value2", 60, ["tag2"]);
	 * cache.set("key3", "value3", 60, ["tag1", "tag2"]);
	 * cache.invalidateTagsUnion(["tag1", "tag2"]);
	 * // All keys with either "tag1" or "tag2" will be invalidated
	 * // In this case, "key1", "key2", and "key3" will be invalidated.
	 * cache.get("key1"); // undefined
	 * cache.get("key2"); // undefined
	 * cache.get("key3"); // undefined
	 */
	public invalidateTagsUnion(tags: string[]): void {
		const uniqueKeys = new Set<Key>();
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

	/**
	 * Flushes all keys and tags from the cache.
	 * @returns void
	 */
	public override flushAll(): void {
		super.flushAll();
		this.tagMap.clear();
	}

	/**
	 * Returns the tag map used by the Cache class.
	 * @returns Tag map
	 */
	public getTagMap(): Map<string, Set<Key>> {
		super.addListener;
		return this.tagMap;
	}
}
