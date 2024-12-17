# node-cache-plus

`node-cache-plus` is a wrapper around the popular library [`node-cache`](https://github.com/node-cache/node-cache/tree/master) with additional features such tag-based invalidation, factory functions, and other helpers for in-memory caching in Node.js applications.

## Installation

To install `node-cache-plus`, use your preferred package manager:

```bash
npm install node-cache-plus
```

## Usage

`node-cache-plus` is a drop-in replacement for `node-cache`. It provides the same API as `node-cache` with additional features. Refer to the `node-cache` [documentation](https://github.com/node-cache/node-cache#options) for more information on the basic usage and initialisation options.

### Basic Usage

```typescript
import { Cache } from "node-cache-plus";

const cache = new Cache();

// Set a value with a TTL of 60 seconds
cache.set("key", "value", 60);

// Get the value
const value = cache.get("key");
console.log(value); // Output: "value"

// Delete the value
cache.del("key");
```

### Tag-based Invalidation

```typescript
// Set a value with tags
cache.set("key1", "value1", 60, ["tag1"]);
cache.set("key2", "value2", 60, ["tag2"]);
cache.set("key3", "value3", 60, ["tag1", "tag2"]);

// Invalidate all keys with a specific tag
cache.invalidateTag("tag1"); // i.e. Invalidates keys "key1" and "key3"

// Invalidate keys that have all specified tags
cache.invalidateTagsIntersection(["tag1", "tag2"]); // i.e. Invalidates key "key3"

// Invalidate keys that have at least one of the specified tags
cache.invalidateTagsUnion(["tag1", "tag2"]); // i.e. Invalidates keys "key1" and "key2"
```

### `withCache` Helper Function

```typescript
import { withCache } from "node-cache-plus";

async function fetchData(param: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`data_${param}`);
    }, 500);
  });
}

const cachedFetchData = withCache(fetchData, { ttl: 600, tags: ["data"] });

const data = await cachedFetchData("param1");
console.log(data); // Output: "data_param1"
```

_Note: This function uses the default cache, but you can pass a custom cache instance as an option. See details in the [Configuring Default Cache](#configuring-default-cache) section below._

### `cachedCall` Helper Function

```typescript
import { cachedCall } from "node-cache-plus";

async function fetchData(param: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`data_${param}`);
    }, 500);
  });
}

const data = await cachedCall(
  fetchData,
  { ttl: 600, tags: ["data"] },
  "param1"
);
console.log(data); // Output: "data_param1"
```

_Note: This function uses the default cache, but you can pass a custom cache instance as an option. See details in the [Configuring Default Cache](#configuring-default-cache) section below._

### Configuring Default Cache

The helper functions `withCache` and `cachedCall` use a default cache instance. You can configure the default cache instance by using the`configureDefaultCache` function.

```typescript
import { configureDefaultCache, getDefaultCache } from "node-cache-plus";

// Configure the default cache with custom options
configureDefaultCache({ stdTTL: 100, checkperiod: 120 });

// Get the default cache instance
const defaultCache = getDefaultCache();

// Use the default cache instance
defaultCache.set("key", "value", 60);
const value = defaultCache.get("key");
console.log(value); // Output: "value"
```
