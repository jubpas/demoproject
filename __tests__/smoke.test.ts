import { describe, it, expect } from "vitest";

describe("Smoke Test", () => {
  it("should pass this basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string assertions", () => {
    expect("hello").toBe("hello");
  });

  it("should handle object assertions", () => {
    const obj = { a: 1, b: 2 };
    expect(obj).toHaveProperty("a", 1);
    expect(obj).toHaveProperty("b", 2);
  });
});
