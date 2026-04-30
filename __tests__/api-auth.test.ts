import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
const originalFetch = global.fetch;

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
});

afterEach(() => {
  vi.unstubAllGlobals();
  global.fetch = originalFetch;
});

// Top-level mocks with mutable spies that tests can configure
const userFindUnique = vi.fn();
const pwdTokenUpdateMany = vi.fn().mockResolvedValue({ count: 0 });
const pwdTokenCreate = vi.fn().mockResolvedValue({ id: "token-1", tokenHash: "abc", userId: "1", expiresAt: new Date() });
const pwdTokenFindUnique = vi.fn();
const pwdTokenUpdate = vi.fn().mockResolvedValue({});
const $transaction = vi.fn(async () => {});

vi.mock("@/lib/db", () => ({
  default: {
    user: { findUnique: userFindUnique },
    passwordResetToken: {
      updateMany: pwdTokenUpdateMany,
      create: pwdTokenCreate,
      findUnique: pwdTokenFindUnique,
      update: pwdTokenUpdate,
    },
    $transaction,
  },
}));

describe("API: POST /api/forgot-password", () => {
  beforeEach(() => {
    userFindUnique.mockReset();
    pwdTokenCreate.mockReset();
    pwdTokenCreate.mockResolvedValue({ id: "token-1", tokenHash: "abc", userId: "1", expiresAt: new Date() });
    vi.resetModules();
  });

  it("returns 400 when email is missing", async () => {
    const { POST } = await import("@/app/api/forgot-password/route");

    const response = await POST(new Request("http://localhost:3000/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("กรุณากรอกอีเมลให้ถูกต้อง");
  });

  it("returns 400 when email format is invalid", async () => {
    const { POST } = await import("@/app/api/forgot-password/route");

    const response = await POST(new Request("http://localhost:3000/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("กรุณากรอกอีเมลให้ถูกต้อง");
  });

  it("returns 200 with success message for nonexistent email", async () => {
    userFindUnique.mockResolvedValue(null);
    const { POST } = await import("@/app/api/forgot-password/route");

    const response = await POST(new Request("http://localhost:3000/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nobody@example.com" }),
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้");
  });

  it("returns 200 with success message for user without password", async () => {
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "oauth@example.com",
      password: null,
    });
    const { POST } = await import("@/app/api/forgot-password/route");

    const response = await POST(new Request("http://localhost:3000/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "oauth@example.com" }),
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้");
  });

  it("returns 200 with mock resetUrl in non-production when no mail config exists", async () => {
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "user@example.com",
      password: "hashed",
    });
    const { POST } = await import("@/app/api/forgot-password/route");

    const response = await POST(new Request("http://localhost:3000/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้");
    expect(body.resetUrl).toContain("/th/reset-password/");
  });

  it("does not return resetUrl in production when mail config is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    userFindUnique.mockResolvedValue({
      id: "1",
      email: "user@example.com",
      password: "hashed",
    });
    const { POST } = await import("@/app/api/forgot-password/route");

    const response = await POST(new Request("http://localhost:3000/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้");
    expect(body.resetUrl).toBeUndefined();
  });

  it("returns English messages when locale=en", async () => {
    const { POST } = await import("@/app/api/forgot-password/route");

    const response = await POST(new Request("http://localhost:3000/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad", locale: "en" }),
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Please enter a valid email address");
  });

  it("normalizes email to lowercase", async () => {
    userFindUnique.mockResolvedValue(null);
    const { POST } = await import("@/app/api/forgot-password/route");

    await POST(new Request("http://localhost:3000/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "  USER@Example.COM  " }),
    }));

    expect(userFindUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { id: true, email: true, password: true },
    });
  });
});

describe("API: POST /api/reset-password", () => {
  beforeEach(() => {
    pwdTokenFindUnique.mockReset();
    pwdTokenUpdate.mockReset();
  });

  it("returns 400 when token and password are missing", async () => {
    const { POST } = await import("@/app/api/reset-password/route");

    const response = await POST(new Request("http://localhost:3000/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("กรุณากรอกข้อมูลให้ครบ");
  });

  it("returns 400 when password is too short", async () => {
    const { POST } = await import("@/app/api/reset-password/route");

    const response = await POST(new Request("http://localhost:3000/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "abc", password: "123" }),
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
  });

  it("returns 400 when token is invalid or already used", async () => {
    pwdTokenFindUnique.mockResolvedValue(null);
    const { POST } = await import("@/app/api/reset-password/route");

    const response = await POST(new Request("http://localhost:3000/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid-token", password: "123456" }),
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือไม่สามารถใช้งานได้แล้ว");
  });

  it("returns 410 when token is expired", async () => {
    pwdTokenFindUnique.mockResolvedValue({
      id: "1",
      tokenHash: "abc",
      userId: "1",
      expiresAt: new Date(Date.now() - 60 * 60 * 1000),
      usedAt: null,
    });
    const { POST } = await import("@/app/api/reset-password/route");

    const response = await POST(new Request("http://localhost:3000/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "expired-token", password: "123456" }),
    }));

    expect(response.status).toBe(410);
    const body = await response.json();
    expect(body.error).toBe("ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอใหม่อีกครั้ง");
  });
});
