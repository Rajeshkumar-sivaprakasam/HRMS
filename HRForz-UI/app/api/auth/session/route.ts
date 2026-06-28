import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Cookie-bridge session endpoint (Next 16 Route Handler).
 *
 * The backend still returns the JWT in the login JSON response. The client
 * posts it here so we can store it in an httpOnly cookie that:
 *   - JavaScript cannot read (XSS-safe), and
 *   - the Next.js server (middleware + Server Components) CAN read.
 *
 * This unlocks server-side auth and SSR without requiring a backend change.
 */

const ONE_WEEK = 60 * 60 * 24 * 7;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: ONE_WEEK,
};

export async function POST(request: Request) {
  let body: { token?: string; role?: string; employeeId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { token, role, employeeId } = body;
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  const store = await cookies();
  store.set('hrforz_token', token, COOKIE_OPTIONS);
  if (role) store.set('hrforz_role', role, COOKIE_OPTIONS);
  if (employeeId) store.set('hrforz_employee_id', employeeId, COOKIE_OPTIONS);

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete('hrforz_token');
  store.delete('hrforz_role');
  store.delete('hrforz_employee_id');
  return NextResponse.json({ ok: true });
}
