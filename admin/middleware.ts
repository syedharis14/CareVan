import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from './lib/config';

/** Gate every page behind the session cookie; /login is the only public route. */
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const isLogin = req.nextUrl.pathname === '/login';

  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (hasSession && isLogin) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
