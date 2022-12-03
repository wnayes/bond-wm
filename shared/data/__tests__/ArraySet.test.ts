import { describe, expect, test } from "@jest/globals";
import { ArraySet } from "../ArraySet";

describe("ArraySet", () => {
  test("returns false for missing entries", () => {
    const set = new ArraySet();
    expect(set.has([])).toBe(false);
    expect(set.has([1])).toBe(false);
    expect(set.has([1, 2])).toBe(false);
    expect(set.has([1, 2, 3, 4, 5])).toBe(false);

    set.add([1, 2, 3]);

    expect(set.has([])).toBe(false);
    expect(set.has([1])).toBe(false);
    expect(set.has([1, 2])).toBe(false);
    expect(set.has([1, 2, 3, 4, 5])).toBe(false);
  });

  test("returns true for added entries", () => {
    const set = new ArraySet();
    set.add([1, 2, 3]);
    expect(set.has([1, 2, 3])).toBe(true);

    set.add([1, 2, 5]);
    expect(set.has([1, 2, 3])).toBe(true);
    expect(set.has([1, 2, 5])).toBe(true);

    set.add([1, 3, 5]);
    expect(set.has([1, 2, 3])).toBe(true);
    expect(set.has([1, 2, 5])).toBe(true);
    expect(set.has([1, 3, 5])).toBe(true);

    set.add([2, 3, 5]);
    expect(set.has([1, 2, 3])).toBe(true);
    expect(set.has([1, 2, 5])).toBe(true);
    expect(set.has([1, 3, 5])).toBe(true);
    expect(set.has([2, 3, 5])).toBe(true);
  });
});
