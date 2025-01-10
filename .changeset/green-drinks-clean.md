---
"node-cache-plus": minor
---

Improved key generation for helper functions withCache & cachedCall - they now prefix the helper name to the key to avoid cache clashes with anonymous functions between helpers. They will still clash within the same helper - use an explicit key if you wish to avoid this.
