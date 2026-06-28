import { NextResponse, type NextRequest } from 'next/server';

/**
 * Server-side auth gate (runs before any page renders).
 * Replaces the client-side RoleGuard: unauthenticated users are redirected
 * to /login on the SERVER, so protected pages can be safely server-rendered.
 */

const PUBLIC_PATHS = ['/login', '/forgot-password'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log("pathname",pathname)
  const token = req.cookies.get('hrforz_token')?.value;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // No session → block protected routes.
  if (!token && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Already authenticated → keep them out of the auth pages.
  if (token && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)'],
};
