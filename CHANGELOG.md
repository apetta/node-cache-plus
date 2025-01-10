# node-cache-plus

## 2.1.0

### Minor Changes

- 002e3b4: Improved key generation for helper functions withCache & cachedCall - they now prefix the helper name to the key to avoid cache clashes with anonymous functions between helpers. They will still clash within the same helper - use an explicit key if you wish to avoid this.

## 2.0.3

### Patch Changes

- aedaf21: docs(README): enhance tag invalidation section with detailed examples

## 2.0.2

### Patch Changes

- 6a6a145: fix typo in docs

## 2.0.1

### Patch Changes

- c036218: Updating readme with docs & examples

## 2.0.0

### Major Changes

- eda4268: Migrating from @cacheable/node-cache to node-cache. Extending base class with NodeCache to expose all methods and allow drop-in replacement of node-cache.

## 1.0.1

### Patch Changes

- f8494ab: initial version
