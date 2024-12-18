# node-cache-plus

`node-cache-plus` is a wrapper around the popular library [`node-cache`](https://github.com/node-cache/node-cache/tree/master) with additional features such as tag-based invalidation, factory functions, and other helpers for in-memory caching in Node.js applications.

## Installation

To install `node-cache-plus`, use your preferred package manager:

```bash
npm install node-cache-plus
```

## Usage

`node-cache-plus` is a drop-in replacement for `node-cache`. It provides the same API as `node-cache` with additional features. Refer to the `node-cache` [documentation](https://github.com/node-cache/node-cache#options) for more information on the basic usage and initialisation options.

TypeDoc reference is available [here](https://apetta.github.io/node-cache-plus/).

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

#### Invalidate a single tag

`invalidateTag` method invalidates all keys with a specific tag.

```typescript
// Set values with tags
cache.set("key1", "value1", 60, ["tag1"]);
cache.set("key2", "value2", 60, ["tag2"]);
cache.set("key3", "value3", 60, ["tag1", "tag2"]);

// Invalidate all keys with a specific tag
cache.invalidateTag("tag1"); // i.e. Invalidates keys "key1" and "key3"

cache.get("key1"); // Output: undefined
cache.get("key2"); // Output: "value2"
cache.get("key3"); // Output: undefined
```

#### Invalidate Intersection of Tags

`invalidateTagsIntersection` method invalidates keys that have _all_ specified tags.

```typescript
// Set values with tags
cache.set("key1", "value1", 60, ["tag1"]);
cache.set("key2", "value2", 60, ["tag2"]);
cache.set("key3", "value3", 60, ["tag1", "tag2"]);

// Invalidate keys that have all specified tags
cache.invalidateTagsIntersection(["tag1", "tag2"]); // i.e. Invalidates key "key3"

cache.get("key1"); // Output: "value1"
cache.get("key2"); // Output: "value2"
cache.get("key3"); // Output: undefined
```

#### Invalidate Union of Tags

`invalidateTagsUnion` method invalidates keys that have _at least one_ of the specified tags.

```typescript
// Set values with tags
cache.set("key1", "value1", 60, ["tag1"]);
cache.set("key2", "value2", 60, ["tag2"]);
cache.set("key3", "value3", 60, ["tag1", "tag2"]);

// Invalidate keys that have at least one of the specified tags
cache.invalidateTagsUnion(["tag1", "tag2"]); // i.e. Invalidates all keys

cache.get("key1"); // Output: undefined
cache.get("key2"); // Output: undefined
cache.get("key3"); // Output: undefined
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

_Note: This function uses the default cache, see details in the [Configuring Default Cache](#configuring-default-cache) section below. You can also pass a custom cache instance as a prop to the `withCache` helper_

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

_Note: This function uses the default cache, see details in the [Configuring Default Cache](#configuring-default-cache) section below. You can also pass a custom cache instance as a prop to the `cachedCall` helper_

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
