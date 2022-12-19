import { describe, expect, test } from "@jest/globals";
import { anyIntersect } from "../utils";

describe("anyIntersect", () => {
  test("returns false for non-intersecting arrays", () => {
    expect(anyIntersect([1, 2, 3], [4, 5, 6])).toBe(false);
  });

  test("returns true for intersecting arrays", () => {
    expect(anyIntersect([1, 2, 3], [3, 2, 1])).toBe(true);
  });
});
