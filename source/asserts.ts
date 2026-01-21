import assert from "assert";
export {
  deepEqual,
  deepStrictEqual,
  doesNotMatch,
  doesNotReject,
  doesNotThrow,
  equal,
  fail,
  ifError,
  match,
  notDeepEqual,
  notDeepStrictEqual,
  notEqual,
  notStrictEqual,
  ok,
  rejects,
  strictEqual,
  throws,
} from "assert";

export function or(a: () => void, ...rest: Array<() => void>) {
  try {
    a();
  } catch(aErr) {
    if(rest.length === 0) throw aErr;
    try {
      or(rest[0], ...rest.slice(1));
    } catch(bErr) {
      throw new assert.AssertionError({
        message: `Tried multiple asserts, but they all failed.\n${aErr}\n\n${bErr}`,
      });
    }
  }
}

export function isNullish(a: unknown): asserts a is null | undefined {
  if(a == null) return;
  throw new assert.AssertionError({
    message: "Expected a null or undefined value",
    actual: a,
    expected: null,
    operator: "==",
  });
}

export function isNotNullish<T extends any>(a: T): asserts a is Exclude<T, null | undefined> {
  if(a != null) return;
  throw new assert.AssertionError({
    message: "Expected a non-null, non-undefined value",
    actual: a,
  });
}

export function isEmptyArray(a: any[]) {
  if(a.length === 0) return true;
  throw new assert.AssertionError({
    message: "Expected an empty array",
    actual: a,
    expected: [],
  });
}

export function isNotEmptyArray(a: any[] | undefined) {
  if(a == null) {
    throw new assert.AssertionError({
      message: "Expected a non-empty array",
      actual: a,
    });
  }
  if(a.length !== 0) return true;
  throw new assert.AssertionError({
    message: "Expected a non-empty array",
    actual: a,
  });
}

export function startsWith(a: string, prefix: string) {
  if(a.startsWith(prefix)) return true;
  throw new assert.AssertionError({
    message: "Expected to start with: " + prefix,
    actual: a,
  });
}

export function gt(num: number, target: number) {
  if(num > target) return true;
  throw new assert.AssertionError({
    message: `Expected ${num} > ${target}`,
    actual: num,
  });
}

export function gte(num: number, target: number) {
  if(num >= target) return true;
  throw new assert.AssertionError({
    message: `Expected ${num} >= ${target}`,
    actual: num,
  });
}

export function stringContains(str: string, expected: string) {
  if(typeof str !== "string") {
    throw new assert.AssertionError({
      message: "Expected input to be of type string.",
      actual: typeof str,
    });
  }
  if(str.includes(expected)) return true;
  throw new assert.AssertionError({
    message: `Expected string to contain: "${expected}"`,
    actual: str,
  });
}
