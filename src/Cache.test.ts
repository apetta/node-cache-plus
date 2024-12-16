import { describe, it, expect, beforeEach } from "vitest";
import { Cache } from "./Cache";

describe("Cache", () => {
	let cache: Cache;

	beforeEach(() => {
		cache = new Cache();
	});

	it("should set and get values correctly", () => {
		cache.set("key0", "value0", 10000, []);
		cache.set("key1", "value1", 10000, ["tag1"]);
		cache.set("key2", "value2", 10000, ["tag2"]);
		cache.set("key3", "value3", 10000, ["tag1", "tag2"]);
		cache.set("key4", "value4", 10000, ["tagA"]);
		cache.set("key5", "value5", 10000, ["tagB"]);
		cache.set("key6", "value6", 10000, ["tagA", "tagB"]);
		cache.set("key7", "value7", 10000, ["tagZ"]);
		cache.set("key8", "value8", 10000, ["tagY"]);
		cache.set("key9", "value9", 10000, ["tagZ", "tagY"]);

		expect(cache.get("key0")).toBe("value0");
		expect(cache.get("key1")).toBe("value1");
		expect(cache.get("key2")).toBe("value2");
		expect(cache.get("key3")).toBe("value3");
		expect(cache.get("key4")).toBe("value4");
		expect(cache.get("key5")).toBe("value5");
		expect(cache.get("key6")).toBe("value6");
	});

	it("should delete a key", () => {
		cache.set("key0", "value0", 10000, []);
		cache.del("key0");
		expect(cache.get("key0")).toBeUndefined();
	});

	it("should invalidate a tag", () => {
		cache.set("key1", "value1", 10000, ["tag1"]);
		cache.set("key2", "value2", 10000, ["tag2"]);
		cache.set("key3", "value3", 10000, ["tag1", "tag2"]);
		cache.invalidateTag("tag1");
		expect(cache.get("key1")).toBeUndefined();
		expect(cache.get("key3")).toBeUndefined();
		expect(cache.get("key2")).toBe("value2");
	});

	it("should invalidate intersection of tags", () => {
		cache.set("key4", "value4", 10000, ["tagA"]);
		cache.set("key5", "value5", 10000, ["tagB"]);
		cache.set("key6", "value6", 10000, ["tagA", "tagB"]);
		cache.invalidateTagsIntersection(["tagA", "tagB"]);
		expect(cache.get("key6")).toBeUndefined();
		expect(cache.get("key4")).toBe("value4");
		expect(cache.get("key5")).toBe("value5");
	});

	it("should invalidate union of tags", () => {
		cache.set("key7", "value7", 10000, ["tagZ"]);
		cache.set("key8", "value8", 10000, ["tagY"]);
		cache.set("key9", "value9", 10000, ["tagZ", "tagY"]);
		cache.invalidateTagsUnion(["tagZ", "tagY"]);
		expect(cache.get("key7")).toBeUndefined();
		expect(cache.get("key8")).toBeUndefined();
		expect(cache.get("key9")).toBeUndefined();
	});

	it("should handle TTL correctly", async () => {
		cache.set("keyTTLShort", "valueTTLShort", 1, ["ttlTag"]); // 1 second TTL
		expect(cache.get("keyTTLShort")).toBe("valueTTLShort");

		await new Promise((resolve) => setTimeout(resolve, 1100));
		expect(cache.get("keyTTLShort")).toBeUndefined();

		cache.set("keyTTLLong", "valueTTLLong", 2, ["ttlTagLong"]); // 2 seconds TTL
		expect(cache.get("keyTTLLong")).toBe("valueTTLLong");

		await new Promise((resolve) => setTimeout(resolve, 1100));
		expect(cache.get("keyTTLLong")).toBe("valueTTLLong");

		await new Promise((resolve) => setTimeout(resolve, 2100));
		expect(cache.get("keyTTLLong")).toBeUndefined();
	});
});
