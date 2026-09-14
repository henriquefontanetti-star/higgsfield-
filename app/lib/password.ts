import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Hash de senha usando scrypt (nativo do Node) — sem dependências externas.
// Extraído de auth.ts para que scripts fora do runtime do Next (como o seed)
// possam reutilizá-lo sem importar `next/headers`.

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, hashBuffer.length);
  return candidate.length === hashBuffer.length && timingSafeEqual(candidate, hashBuffer);
}
