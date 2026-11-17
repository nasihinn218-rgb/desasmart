import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'desasmart-fallback-secret-2026';
const COOKIE_NAME = 'desasmart_session';

// Role → dashboard path
const ROLE_DASHBOARD: Record<string, string> = {
  MASYARAKAT: '/dashboard/masyarakat',
  STAFF: '/dashboard/staf',
  SUPERADMIN: '/dashboard/superadmin',
  KEPALA_DESA: '/dashboard/kades',
};

// Protected paths dan role yang diizinkan
const PROTECTED_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: '/dashboard/masyarakat', roles: ['MASYARAKAT'] },
  { prefix: '/dashboard/staf',       roles: ['STAFF', 'SUPERADMIN'] },
  { prefix: '/dashboard/superadmin', roles: ['SUPERADMIN'] },
  { prefix: '/dashboard/kades',      roles: ['KEPALA_DESA'] },
  { prefix: '/dashboard/audit-logs', roles: ['SUPERADMIN', 'KEPALA_DESA'] },
  { prefix: '/dashboard/notifikasi-proses', roles: ['STAFF', 'SUPERADMIN', 'KEPALA_DESA'] },
];

async function getTokenPayload(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { role?: string; userId?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ambil token dari cookie
  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Redirect akses ke /login-petugas langsung ke /login
  if (pathname === '/login-petugas') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect logged-in user yang buka /login ke dashboard-nya
  if (pathname === '/login') {
    if (token) {
      const payload = await getTokenPayload(token);
      if (payload?.role) {
        const dest = ROLE_DASHBOARD[payload.role] ?? '/dashboard/masyarakat';
        return NextResponse.redirect(new URL(dest, req.url));
      }
    }
    return NextResponse.next();
  }

  // Cek protected routes
  const matched = PROTECTED_ROUTES.find((r) => pathname.startsWith(r.prefix));
  if (!matched) return NextResponse.next();

  // Belum login → ke halaman login
  if (!token) {
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, req.url));
  }

  const payload = await getTokenPayload(token);

  // Token tidak valid → hapus cookie dan redirect login
  if (!payload?.role) {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  // Role tidak sesuai → redirect ke dashboard role yang benar
  if (!matched.roles.includes(payload.role)) {
    const correctDest = ROLE_DASHBOARD[payload.role] ?? '/login';
    return NextResponse.redirect(new URL(correctDest, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/login-petugas',
    '/dashboard/:path*',
  ],
};
