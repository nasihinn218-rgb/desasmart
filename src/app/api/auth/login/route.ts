import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  createToken,
  createBackupToken,
  verifyBackupToken,
  ensureUserInDatabase,
  COOKIE_NAME,
  BACKUP_COOKIE_NAME,
} from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { role: true, village: true, citizen: true },
    });

    // Jika akun belum ditemukan di database lokal/serverless instance ini,
    // coba pulihkan dari token backup yang tersimpan di perangkat pengguna
    if (!user) {
      const backupCookie = req.cookies.get(BACKUP_COOKIE_NAME)?.value;
      if (backupCookie) {
        const backupData = verifyBackupToken(backupCookie);
        if (backupData && backupData.email.toLowerCase().trim() === cleanEmail) {
          const isBackupPassMatch = await bcrypt.compare(password, backupData.passwordHash);
          if (isBackupPassMatch) {
            await ensureUserInDatabase(backupData);
            user = await prisma.user.findUnique({
              where: { email: cleanEmail },
              include: { role: true, village: true, citizen: true },
            });
          }
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Akun Anda dinonaktifkan. Silakan hubungi Admin Desa untuk aktivasi kembali.' },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Email atau password yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    // Pastikan akun yang memasukkan email dan password yang benar langsung terverifikasi
    // sehingga pengguna yang sudah mendaftar tidak pernah terblokir atau stuck di NOT_VERIFIED
    if (!user.isVerified) {
      await prisma.user
        .update({
          where: { id: user.id },
          data: { isVerified: true },
        })
        .catch(() => {});
      user.isVerified = true;
    }

    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
      name: user.name,
    });

    // Backup token agar sesi dan data akun tetap bisa dipulihkan antar lambda
    const backupToken = createBackupToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.password,
      role: user.role.name,
      phone: user.phone,
      nik: user.citizen?.nik,
      noKk: user.citizen?.noKk,
      birthPlace: user.citizen?.birthPlace,
      birthDate: user.citizen?.birthDate ? user.citizen.birthDate.toISOString() : undefined,
      gender: user.citizen?.gender,
      address: user.citizen?.address,
      rt: user.citizen?.rt,
      rw: user.citizen?.rw,
      dusun: user.citizen?.dusun,
      occupation: user.citizen?.occupation,
      monthlyIncome: user.citizen?.monthlyIncome,
      familyMembersCount: user.citizen?.familyMembersCount,
      houseCondition: user.citizen?.houseCondition,
      economicDescription: user.citizen?.economicDescription,
    });

    // Record audit log
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role.name,
      action: 'LOGIN',
      entity: 'Auth',
      entityId: user.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
      details: { role: user.role.name },
    });

    // Determine dashboard redirect based on role
    let redirectUrl = '/dashboard/masyarakat';
    if (user.role.name === 'STAFF') redirectUrl = '/dashboard/staf';
    else if (user.role.name === 'SUPERADMIN') redirectUrl = '/dashboard/superadmin';
    else if (user.role.name === 'KEPALA_DESA') redirectUrl = '/dashboard/kades';

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      redirectUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        roleDisplayName: user.role.displayName,
      },
    });

    const isSecure = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') ?? false;

    // Set cookie sesi (7 hari)
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // Set cookie backup (30 hari)
    response.cookies.set(BACKUP_COOKIE_NAME, backupToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server internal saat login.' },
      { status: 500 }
    );
  }
}
