// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookieStore),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets an httpOnly cookie with a JWT", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, token, options] = mockCookieStore.set.mock.calls[0];

  expect(name).toBe("auth-token");
  expect(typeof token).toBe("string");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
  expect(options.expires).toBeInstanceOf(Date);
});

test("getSession returns payload when valid token exists", async () => {
  const { getSession } = await import("@/lib/auth");

  const token = await new SignJWT({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-1");
  expect(session!.email).toBe("test@example.com");
});

test("getSession returns null when no cookie exists", async () => {
  const { getSession } = await import("@/lib/auth");

  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for an invalid token", async () => {
  const { getSession } = await import("@/lib/auth");

  mockCookieStore.get.mockReturnValue({ value: "invalid-token" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for a token signed with a different secret", async () => {
  const { getSession } = await import("@/lib/auth");

  const wrongSecret = new TextEncoder().encode("wrong-secret");
  const token = await new SignJWT({ userId: "user-1", email: "test@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(wrongSecret);

  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).toBeNull();
});

test("deleteSession removes the auth cookie", async () => {
  const { deleteSession } = await import("@/lib/auth");

  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
});

test("verifySession returns payload from request cookies", async () => {
  const { verifySession } = await import("@/lib/auth");

  const token = await new SignJWT({
    userId: "user-2",
    email: "other@example.com",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  const request = {
    cookies: { get: vi.fn().mockReturnValue({ value: token }) },
  } as any;

  const session = await verifySession(request);

  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-2");
  expect(session!.email).toBe("other@example.com");
  expect(request.cookies.get).toHaveBeenCalledWith("auth-token");
});

test("verifySession returns null when request has no auth cookie", async () => {
  const { verifySession } = await import("@/lib/auth");

  const request = {
    cookies: { get: vi.fn().mockReturnValue(undefined) },
  } as any;

  const session = await verifySession(request);
  expect(session).toBeNull();
});

test("verifySession returns null for an invalid token in request", async () => {
  const { verifySession } = await import("@/lib/auth");

  const request = {
    cookies: { get: vi.fn().mockReturnValue({ value: "bad-token" }) },
  } as any;

  const session = await verifySession(request);
  expect(session).toBeNull();
});
