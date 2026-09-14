import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/app/lib/auth";

// Next.js 16 renomeou `middleware.ts` para `proxy.ts` (função `proxy`).
// Aqui protegemos toda a aplicação: sem sessão válida, só é possível acessar
// a tela de login e o endpoint que autentica.

const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PATHS = ["/api/auth/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  const isPublicPage = PUBLIC_PATHS.includes(pathname);
  const isPublicApi = PUBLIC_API_PATHS.includes(pathname);

  if (session) {
    if (isPublicPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads/|.*\\.(?:png|jpg|jpeg|gif|svg|ico)$).*)",
  ],
};
