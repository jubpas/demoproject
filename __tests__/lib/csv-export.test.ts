import { describe, it, expect } from "vitest";
import { escapeCSV } from "../../src/lib/csv-export";

describe("csv-export - escapeCSV", () => {
  it("should escape values containing commas", () => {
    expect(escapeCSV("John, Doe")).toBe('"John, Doe"');
  });

  it("should escape values containing double quotes", () => {
    expect(escapeCSV('Say "Hi"')).toBe('"Say ""Hi"""');
  });

  it("should escape values containing newlines", () => {
    expect(escapeCSV("Line1\nLine2")).toBe('"Line1\nLine2"');
  });

  it("should escape values containing carriage return", () => {
    expect(escapeCSV("Line1\rLine2")).toBe('"Line1\rLine2"');
  });

  it("should not quote plain values", () => {
    expect(escapeCSV("John")).toBe("John");
  });

  it("should handle empty string", () => {
    expect(escapeCSV("")).toBe("");
  });

  it("should treat null as empty string", () => {
    expect(escapeCSV(null)).toBe("");
  });

  it("should treat undefined as empty string", () => {
    expect(escapeCSV(undefined)).toBe("");
  });

  it("should convert numbers to string", () => {
    expect(escapeCSV(42)).toBe("42");
  });

  it("should convert objects to string via toString", () => {
    expect(escapeCSV({ toString: () => "obj" })).toBe("obj");
  });

  it("should escape header-like values with commas", () => {
    expect(escapeCSV("First, Last")).toBe('"First, Last"');
  });

  it("should escape header-like values with quotes", () => {
    expect(escapeCSV('"Quoted"')).toBe('"""Quoted"""');
  });
});
