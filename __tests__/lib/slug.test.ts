import { describe, it, expect } from "vitest";
import { slugify } from "../../src/lib/slug";

describe("slugify", () => {
  // --- English text ---
  it("should convert English text to lowercase slug with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should trim leading and trailing spaces", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("should collapse multiple spaces to single hyphen", () => {
    expect(slugify("Hello    World")).toBe("hello-world");
  });

  it("should handle single word", () => {
    expect(slugify("Hello")).toBe("hello");
  });

  it("should handle already slugified text", () => {
    expect(slugify("hello-world")).toBe("hello-world");
  });

  // --- Special characters ---
  it("should remove special characters (ampersand, exclamation)", () => {
    expect(slugify("Hello & World!")).toBe("hello-world");
  });

  it("should remove plus signs and collapse resulting hyphens", () => {
    expect(slugify("C++ Programming")).toBe("c-programming");
  });

  it("should remove parentheses", () => {
    expect(slugify("Hello (World)")).toBe("hello-world");
  });

  it("should remove dots and underscores", () => {
    expect(slugify("v1.0.0_release")).toBe("v100release");
  });

  it("should handle strings with only special characters", () => {
    expect(slugify("!@#$%^&*()")).toBe("");
  });

  // --- Multiple hyphens ---
  it("should collapse multiple hyphens into one", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("should trim leading/trailing hyphens", () => {
    expect(slugify("-hello-world-")).toBe("hello-world");
  });

  // --- Numbers ---
  it("should preserve numbers", () => {
    expect(slugify("Project 123")).toBe("project-123");
  });

  it("should handle mixed alphanumeric", () => {
    expect(slugify("ABC 123 XYZ")).toBe("abc-123-xyz");
  });

  // --- Thai text ---
  // slugify only keeps a-z, 0-9, spaces, and hyphens → Thai chars are stripped
  it("should strip Thai characters (not in a-z0-9 range)", () => {
    expect(slugify("สวัสดี")).toBe("");
  });

  it("should strip Thai text but keep any English/number parts", () => {
    // "สวัสดี Hello 123" → only "Hello 123" remains after stripping Thai
    expect(slugify("สวัสดี Hello 123")).toBe("hello-123");
  });

  it("should handle mixed Thai and special characters", () => {
    expect(slugify("โปรเจกต์ ABC!")).toBe("abc");
  });

  // --- Edge cases ---
  it("should return empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("should return empty string for whitespace-only input", () => {
    expect(slugify("   ")).toBe("");
  });

  it("should handle uppercase input", () => {
    expect(slugify("HELLO WORLD")).toBe("hello-world");
  });

  it("should handle mixed case input", () => {
    expect(slugify("HeLLo WoRLd")).toBe("hello-world");
  });
});
