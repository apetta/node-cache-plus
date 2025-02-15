import { beforeEach, describe, expect, it } from "vitest";
import { Cache } from "../Cache";

describe("Cache", () => {
	let cache: Cache;

	beforeEach(() => {
		cache = new Cache();
	});

	it("should set, get, and take values correctly", () => {
		cache.set("key0", "value0", 60);
		cache.set("key1", "value1", 60, ["tag1"]);
		cache.set("key2", "value2", 60, ["tag2"]);
		cache.set("key3", "value3", 60, ["tag1", "tag2"]);
		cache.set("key4", "value4", 60, ["tagA"]);
		cache.set("key5", "value5", 60, ["tagB"]);
		cache.set("key6", "value6", 60, ["tagA", "tagB"]);
		cache.set("key7", "value7", 60, ["tagZ"]);
		cache.set("key8", "value8", 60, ["tagY"]);
		cache.set("key9", "value9", 60, ["tagZ", "tagY"]);

		expect(cache.get("key0")).toBe("value0");
		expect(cache.get("key1")).toBe("value1");
		expect(cache.get("key2")).toBe("value2");
		expect(cache.get("key3")).toBe("value3");
		expect(cache.get("key4")).toBe("value4");
		expect(cache.get("key5")).toBe("value5");
		expect(cache.get("key6")).toBe("value6");
	});

	it("should take values correctly", () => {
		cache.set("key0", "value0", 60, ["test"]);

		// verify tag is set
		expect(cache.getTagMap().get("test")).toEqual(new Set(["key0"]));

		// take value
		expect(cache.take("key0")).toBe("value0");

		// check if key was removed
		expect(cache.get("key0")).toBeUndefined();

		// check if tag was removed
		expect(cache.getTagMap().get("test")).toBeUndefined();
	});

	it("should delete a key", () => {
		cache.set("key0", "value0", 60, []);
		cache.del("key0");
		expect(cache.get("key0")).toBeUndefined();
	});

	it("should invalidate a tag", () => {
		cache.set("key1", "value1", 60, ["tag1"]);
		cache.set("key2", "value2", 60, ["tag2"]);
		cache.set("key3", "value3", 60, ["tag1", "tag2"]);
		cache.invalidateTag("tag1");
		expect(cache.get("key1")).toBeUndefined();
		expect(cache.get("key3")).toBeUndefined();
		expect(cache.get("key2")).toBe("value2");
	});

	it("should invalidate intersection of tags", () => {
		cache.set("key4", "value4", 60, ["tagA"]);
		cache.set("key5", "value5", 60, ["tagB"]);
		cache.set("key6", "value6", 60, ["tagA", "tagB"]);
		cache.invalidateTagsIntersection(["tagA", "tagB"]);
		expect(cache.get("key6")).toBeUndefined();
		expect(cache.get("key4")).toBe("value4");
		expect(cache.get("key5")).toBe("value5");
	});

	it("should invalidate union of tags", () => {
		cache.set("key7", "value7", 60, ["tagZ"]);
		cache.set("key8", "value8", 60, ["tagY"]);
		cache.set("key9", "value9", 60, ["tagZ", "tagY"]);
		cache.invalidateTagsUnion(["tagZ", "tagY"]);
		expect(cache.get("key7")).toBeUndefined();
		expect(cache.get("key8")).toBeUndefined();
		expect(cache.get("key9")).toBeUndefined();
	});

	it("should handle TTL correctly", async () => {
		cache.set("keyTTL", "valueTTL", 2, ["ttlTag"]); // 2 seconds TTL
		expect(cache.get("keyTTL")).toBe("valueTTL");

		await new Promise((resolve) => setTimeout(resolve, 1000));
		expect(cache.get("keyTTL")).toBe("valueTTL");

		await new Promise((resolve) => setTimeout(resolve, 2100));
		expect(cache.get("keyTTL")).toBeUndefined();
	});

	it("should flush all keys", () => {
		cache.set("key1", "value1", 60, ["tag1"]);
		cache.set("key2", "value2", 60, ["tag2"]);
		cache.flushAll();
		expect(cache.get("key1")).toBeUndefined();
		expect(cache.get("key2")).toBeUndefined();
		expect(cache.keys().length).toBe(0);
	});

	it("should return all keys", () => {
		cache.set("key1", "value1", 60, ["tag1"]);
		cache.set("key2", "value2", 60, ["tag2"]);
		expect(cache.keys()).toEqual(expect.arrayContaining(["key1", "key2"]));
	});

	it("should set multiple values using mset", () => {
		const items = [
			{ key: "key1", val: "value1", ttl: 60, tags: ["tag1"] },
			{ key: "key2", val: "value2", ttl: 60, tags: ["tag2"] },
			{ key: "key3", val: "value3", ttl: 60, tags: ["tag1", "tag2"] },
		];
		cache.mset(items);

		expect(cache.get("key1")).toBe("value1");
		expect(cache.get("key2")).toBe("value2");
		expect(cache.get("key3")).toBe("value3");
	});

	it("should get multiple values using mget", () => {
		cache.set("key1", "value1", 60, ["tag1"]);
		cache.set("key2", "value2", 60, ["tag2"]);
		cache.set("key3", "value3", 60, ["tag1", "tag2"]);

		const values = cache.mget(["key1", "key2", "key3"]);
		expect(values).toEqual({
			key1: "value1",
			key2: "value2",
			key3: "value3",
		});

		// invalid tag & check if removed
		cache.invalidateTagsIntersection(["tag1", "tag2"]);
		const valuesAfterInvalidation = cache.mget(["key1", "key2", "key3"]);
		expect(valuesAfterInvalidation).toEqual({
			key1: "value1",
			key2: "value2",
			key3: undefined,
		});
	});

	it("should delete multiple keys using mdel", () => {
		cache.set("key1", "value1", 60, ["tag1"]);
		cache.set("key2", "value2", 60, ["tag2"]);
		cache.set("key3", "value3", 60, ["tag1", "tag2"]);

		cache.mdel(["key1", "key2"]);
		expect(cache.get("key1")).toBeUndefined();
		expect(cache.get("key2")).toBeUndefined();
		expect(cache.get("key3")).toBe("value3");
	});

	it("should get the ttl expiration of a key", () => {
		cache.set("keyTTL", "valueTTL", 60);
		expect(cache.getTtl("keyTTL")).toBeGreaterThan(Date.now());
		expect(cache.getTtl("keyTTL")).toBeLessThanOrEqual(Date.now() + 60000);
	});

	it("should redefine the ttl of a key", () => {
		cache.set("keyTTL", "valueTTL", 60);
		// check if less than 60 seconds
		expect(cache.getTtl("keyTTL")).toBeGreaterThan(Date.now());
		expect(cache.getTtl("keyTTL")).toBeLessThanOrEqual(Date.now() + 60000);
		// redefine the ttl
		expect(cache.ttl("keyTTL", 120)).toBe(true);
		// check if greater than 60 seconds & less than 120 seconds
		expect(cache.getTtl("keyTTL")).toBeGreaterThan(Date.now() + 60000);
		expect(cache.getTtl("keyTTL")).toBeLessThanOrEqual(Date.now() + 120000);
	});

	it("should check if a key exists", () => {
		cache.set("keyExists", "valueExists", 60);
		expect(cache.has("keyExists")).toBe(true);
		expect(cache.has("keyNonExists")).toBe(false);
	});

	it("should get all keys", () => {
		cache.set("key1", "value1", 60);
		cache.set("key2", "value2", 60);
		expect(cache.keys()).toEqual(expect.arrayContaining(["key1", "key2"]));
	});

	it("should get the stats of the cache", () => {
		cache.set("keyStats", "valueStats", 60);
		const stats = cache.getStats();
		expect(stats.keys).toBeGreaterThan(0);
		expect(stats.hits).toBe(0);
		expect(stats.misses).toBe(0);

		cache.get("keyStats");
		const statsAfterGet = cache.getStats();
		expect(statsAfterGet.hits).toBe(1);
		expect(statsAfterGet.misses).toBe(0);

		cache.get("keyNonExists");
		const statsAfterGetNonExists = cache.getStats();
		expect(statsAfterGetNonExists.hits).toBe(1);
		expect(statsAfterGetNonExists.misses).toBe(1);

		cache.del("keyStats");
		const statsAfterDelete = cache.getStats();
		expect(statsAfterDelete.keys).toBe(0);
	});

	it("should flush the stats", () => {
		cache.set("keyStats", "valueStats", 60);
		cache.flushStats();
		const stats = cache.getStats();
		expect(stats.hits).toBe(0);
		expect(stats.misses).toBe(0);
	});

	it("should return the tag map", () => {
		cache.set("key1", "value1", 60, ["tag1"]);
		cache.set("key2", "value2", 60, ["tag2"]);
		const tagMap = cache.getTagMap();
		expect(tagMap.get("tag1")).toEqual(new Set(["key1"]));
		expect(tagMap.get("tag2")).toEqual(new Set(["key2"]));
	});

	it("should handle number keys correctly", () => {
		cache.set(1, "value1", 60);
		cache.set(2, "value2", 60, ["tag1"]);
		cache.set(3, "value3", 60, ["tag2"]);
		cache.set(4, "value4", 60, ["tag1", "tag2"]);
		cache.set(5, "value5", 60, ["tagA"]);
		cache.set(6, "value6", 60, ["tagB"]);

		expect(cache.get(1)).toBe("value1");
		expect(cache.get(2)).toBe("value2");
		expect(cache.get(3)).toBe("value3");
		expect(cache.get(4)).toBe("value4");

		cache.del(1);
		expect(cache.get(1)).toBeUndefined();

		cache.invalidateTag("tag1");
		expect(cache.get(2)).toBeUndefined();
		expect(cache.get(3)).toBe("value3");
		expect(cache.get(4)).toBeUndefined();

		cache.invalidateTagsIntersection(["tag1", "tag2"]);

		expect(cache.get(3)).toBeUndefined();
		expect(cache.get(5)).toBe("value5");
		expect(cache.get(6)).toBe("value6");

		cache.invalidateTagsUnion(["tagA", "tagB"]);
		expect(cache.get(5)).toBeUndefined();
		expect(cache.get(6)).toBeUndefined();
	});
});
