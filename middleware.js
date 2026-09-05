import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const EMAIL_ADMIN = "jose@turel.es";

// Bloqueo temporal de todo el sitio mientras fir no está lanzado
// públicamente. Activar/desactivar sin tocar código: variable de entorno
// SITE_LOCKED=true en Dokploy. Quitar la variable (o ponerla a "false")
// reabre el sitio al instante.
const SITE_LOCKED = process.env.SITE_LOCKED === "true";
const RUTA_BLOQUEO = "/proximamente";

// Rutas que deben seguir sirviéndose aunque el sitio esté bloqueado: la
// propia página de bloqueo (evita bucle de redirección) y los assets
// estáticos que esa página necesita para renderizarse.
const RUTAS_EXENTAS_BLOQUEO = ["/manifest.json", "/sw.js", "/icons"];

function exentaDeBloqueo(pathname) {
  return (
    pathname === RUTA_BLOQUEO ||
    RUTAS_EXENTAS_BLOQUEO.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`))
  );
}

// Mismas rutas que protegía el withAuth() anterior por sesión de usuario.
const RUTAS_PROTEGIDAS_SESION = [
  "/inicio",
  "/configuracion",
  "/test",
  "/resultados",
  "/estadisticas",
  "/errores",
  "/perfil",
  "/admin",
];

function necesitaSesion(pathname) {
  return RUTAS_PROTEGIDAS_SESION.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (SITE_LOCKED && !exentaDeBloqueo(pathname)) {
    return NextResponse.redirect(new URL(RUTA_BLOQUEO, request.url));
  }

  if (necesitaSesion(pathname)) {
    const token = await getToken({ req: request });

    if (!token) {
      const signInUrl = new URL("/api/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (pathname.startsWith("/admin") && token.email !== EMAIL_ADMIN) {
      return NextResponse.redirect(new URL("/inicio", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Assets estáticos y endpoints públicos fuera del middleware: no
    // necesitan pasar por la comprobación de sesión.
    "/((?!_next/static|_next/image|favicon.ico|imagenes-fir|api/webhooks/stripe|api/push/send).*)",
  ],
};
