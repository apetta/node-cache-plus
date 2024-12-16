export const add = (a: number, b: number) => a + b;

export { Cache } from "./Cache";
export type { CacheFunctionOptions } from "./types";
export { configureDefaultCache, getDefaultCache } from "./defaults";
export { cachedCall, withCache } from "./helpers";
