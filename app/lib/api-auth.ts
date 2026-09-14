import { NextResponse } from "next/server";
import { getSession } from "./auth";
import type { Role } from "./constants";

// Helper para uso dentro de Route Handlers: garante que o usuário está
// autenticado e, opcionalmente, que possui um dos papéis permitidos.
// A camada de proxy já bloqueia requisições sem sessão, mas cada rota decide
// suas próprias regras de papel (ex: só proprietário/gestor podem cadastrar
// funcionários).
export async function requireSession(allowedRoles?: Role[]) {
  const session = await getSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { session: null, response: NextResponse.json({ error: "Sem permissão" }, { status: 403 }) };
  }
  return { session, response: null };
}
