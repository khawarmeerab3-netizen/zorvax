import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Lightweight route guard. A `zorvax_token` cookie means "probably signed in";
 * the API verifies the JWT on every request.
 */
export function middleware(req: NextRequest) {
  const token = req.cookies.get('zorvax_token')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/chart/:path*', '/compatibility/:path*', '/settings/:path*'],
};
