import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

const MAX_AVATAR_LENGTH = 700_000;

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Sesi telah berakhir, silakan login kembali.' }, { status: 401 });
    }

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const avatarUrl = body.avatarUrl;

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: 'Nama tampilan harus berisi 2 sampai 80 karakter.' },
        { status: 400 }
      );
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phone && (!/^[+\d\s().-]+$/.test(phone) || phoneDigits.length < 8 || phoneDigits.length > 15)) {
      return NextResponse.json(
        { error: 'Nomor telepon harus berisi 8 sampai 15 digit angka.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
    }

    if (email !== currentUser.email.toLowerCase()) {
      const emailTaken = await prisma.user.findFirst({
        where: { email, id: { not: currentUser.id } },
        select: { id: true },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email sudah dipakai oleh akun lain.' },
          { status: 400 }
        );
      }
    }

    if (
      avatarUrl !== null &&
      (typeof avatarUrl !== 'string' ||
        avatarUrl.length > MAX_AVATAR_LENGTH ||
        !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatarUrl))
    ) {
      return NextResponse.json(
        { error: 'Foto profil tidak valid atau ukurannya terlalu besar.' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.$transaction(async (transaction) => {
      const savedUser = await transaction.user.update({
        where: { id: currentUser.id },
        data: {
          name,
          phone: phone || null,
          email,
          avatarUrl,
        },
        select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
      });

      await transaction.citizen.updateMany({
        where: { userId: currentUser.id },
        data: { phone: phone || null },
      });

      return savedUser;
    });

    await logAudit({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: 'PROFILE_UPDATE',
      entity: 'User',
      entityId: currentUser.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
      details: { updatedFields: ['name', 'phone', 'email', 'avatarUrl'] },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan perubahan profil.' }, { status: 500 });
  }
}
