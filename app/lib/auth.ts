import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { Role } from "./constants";
export { hashPassword, verifyPassword } from "./password";

const SESSION_COOKIE = "hg_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 dias

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET não configurado no .env");
  }
  return secret;
}

// --- Sessão (cookie assinado) ------------------------------------------
// Formato: base64(payloadJSON).hmacHex — evita adicionar libs de JWT.

export interface SessionPayload {
  userId: string;
  name: string;
  role: Role;
  exp: number; // epoch seconds
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("hex");
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const data = Buffer.from(JSON.stringify(full)).toString("base64url");
  const signature = sign(data);
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = sign(data);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(payload: Omit<SessionPayload, "exp">) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

// --- Helpers de permissão ------------------------------------------------

export function canManageStaffAndSettings(role: Role): boolean {
  return role === "PROPRIETARIO" || role === "GESTOR";
}

export function canViewStrategicFinance(role: Role): boolean {
  return role === "PROPRIETARIO";
}

export function isStaffRole(role: Role): boolean {
  return role === "PROPRIETARIO" || role === "GESTOR";
}
