import { describe, expect, it } from "vitest";
import { cachedCall, withCache } from "../helpers";

// A mock function that simulates an expensive async operation
async function expensiveFunction(param: string): Promise<string> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(`expensive_result_${param}`);
		}, 500);
	});
}

describe("cachedCall Wrapper", () => {
	it("should run the function and cache the result on initial call", async () => {
		const result = await cachedCall(
			expensiveFunction,
			{ ttl: 2, tags: ["testTag"] },
			"testParam",
		);
		expect(result).toBe("expensive_result_testParam");
	});

	it("should return cached result on second call", async () => {
		await cachedCall(
			expensiveFunction,
			{ ttl: 2, tags: ["testTag"] },
			"testParam",
		);
		const startCachedCall = Date.now();
		const result = await cachedCall(
			expensiveFunction,
			{ ttl: 2, tags: ["testTag"] },
			"testParam",
		);
		const endCachedCall = Date.now();
		expect(result).toBe("expensive_result_testParam");
		expect(endCachedCall - startCachedCall).toBeLessThan(100);
	});
});

async function expensiveOperation(param: string): Promise<string> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(`result_${param}`);
		}, 500);
	});
}

const cachedExpensiveOperation = withCache(expensiveOperation, {
	ttl: 3600,
	tags: ["tag1"],
});

describe("cachedFunction Wrapper", () => {
	it("should run the function and cache the result on initial call", async () => {
		const startFirstCall = Date.now();
		const cachedResult = await cachedExpensiveOperation("param1");
		const endFirstCall = Date.now();
		expect(cachedResult).toBe("result_param1");
		expect(endFirstCall - startFirstCall).toBeGreaterThanOrEqual(500);
	});

	it("should return cached result on second call", async () => {
		await cachedExpensiveOperation("param1");
		const startCachedCall2 = Date.now();
		const cachedResult = await cachedExpensiveOperation("param1");
		const endCachedCall2 = Date.now();
		expect(cachedResult).toBe("result_param1");
		expect(endCachedCall2 - startCachedCall2).toBeLessThan(100);
	});

	it("should run the function again with a different key", async () => {
		const startDifferentCall = Date.now();
		const cachedResult = await cachedExpensiveOperation("param2");
		const endDifferentCall = Date.now();
		expect(cachedResult).toBe("result_param2");
		expect(endDifferentCall - startDifferentCall).toBeGreaterThanOrEqual(500);
	});
});

async function expensiveOperationComplex(param: {
	a: { b: Array<string> };
	c: { d: number };
}): Promise<string> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(`result_${JSON.stringify(param)}`);
		}, 500);
	});
}

const cachedExpensiveOperationComplex = withCache(expensiveOperationComplex, {
	ttl: 3600,
	tags: ["tag1"],
	keyGenerator: (fnName: string, args: any) => {
		return `${fnName}:${JSON.stringify(args)}`;
	},
});

describe("cachedFunction Wrapper with complex parameters", () => {
	it("should run the function and cache the result on initial call", async () => {
		const startFirstCallComplex = Date.now();
		const cachedResultComplex = await cachedExpensiveOperationComplex({
			a: { b: ["param1"] },
			c: { d: 1 },
		});
		const endFirstCallComplex = Date.now();
		expect(cachedResultComplex).toBe(
			'result_{"a":{"b":["param1"]},"c":{"d":1}}',
		);
		expect(endFirstCallComplex - startFirstCallComplex).toBeGreaterThanOrEqual(
			500,
		);
	});

	it("should return cached result on second call", async () => {
		await cachedExpensiveOperationComplex({
			a: { b: ["param1"] },
			c: { d: 1 },
		});
		const startCachedCallComplex = Date.now();
		const cachedResultComplex = await cachedExpensiveOperationComplex({
			a: { b: ["param1"] },
			c: { d: 1 },
		});
		const endCachedCallComplex = Date.now();
		expect(cachedResultComplex).toBe(
			'result_{"a":{"b":["param1"]},"c":{"d":1}}',
		);
		expect(endCachedCallComplex - startCachedCallComplex).toBeLessThan(100);
	});

	it("should run the function again with a different key", async () => {
		const startDifferentCallComplex = Date.now();
		const cachedResultComplex = await cachedExpensiveOperationComplex({
			a: { b: ["param2"] },
			c: { d: 2 },
		});
		const endDifferentCallComplex = Date.now();
		expect(cachedResultComplex).toBe(
			'result_{"a":{"b":["param2"]},"c":{"d":2}}',
		);
		expect(
			endDifferentCallComplex - startDifferentCallComplex,
		).toBeGreaterThanOrEqual(500);
	});
});
