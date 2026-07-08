import { NextRequest, NextResponse } from 'next/server';

// Gates the entire app behind HTTP Basic Auth, but ONLY if APP_PASSWORD is
// set in the environment. Leave it unset on the public demo deployment so
// that one stays open, and set it on your personal deployment.
//
// Username is not checked (there's only one user) — any username works,
// only the password matters. Set APP_PASSWORD in your deployment's env vars.
export function middleware(req: NextRequest) {
  const appPassword = process.env.APP_PASSWORD;

  // No password configured (e.g. the public demo deployment) — let everyone through.
  if (!appPassword) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get('authorization');

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      const [, password] = decoded.split(':');
      if (password === appPassword) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="DSA Tracker"' },
  });
}

// Apply to every route except static assets.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};