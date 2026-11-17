import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';

async function requireSuperadmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: 'Silakan login kembali.' }, { status: 401 }) };
  }
  if (user.role !== 'SUPERADMIN') {
    return { response: NextResponse.json({ error: 'Akses hanya untuk Superadmin.' }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  try {
    const access = await requireSuperadmin();
    if ('response' in access) return access.response;

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: 'MASYARAKAT' },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        phone: true,
        citizen: { select: { fullName: true, phone: true } },
      },
    });

    return NextResponse.json({
      recipients: users.map((user) => ({
        id: user.id,
        name: user.citizen?.fullName || user.name,
        phone: user.phone || user.citizen?.phone || null,
      })),
    });
  } catch (error) {
    console.error('Fetch notification recipients error:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar warga.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await requireSuperadmin();
    if ('response' in access) return access.response;

    const body: unknown = await req.json();
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Data pengumuman tidak valid.' }, { status: 400 });
    }

    const { title, message, recipientIds } = body as Record<string, unknown>;
    if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 100) {
      return NextResponse.json(
        { error: 'Judul wajib diisi (3–100 karakter).' },
        { status: 400 }
      );
    }
    if (
      typeof message !== 'string' ||
      message.trim().length < 5 ||
      message.trim().length > 1000
    ) {
      return NextResponse.json(
        { error: 'Isi pesan wajib diisi (5–1.000 karakter).' },
        { status: 400 }
      );
    }
    if (
      !Array.isArray(recipientIds) ||
      recipientIds.length < 1 ||
      recipientIds.length > 50 ||
      recipientIds.some((id) => typeof id !== 'string' || !id)
    ) {
      return NextResponse.json(
        { error: 'Pilih 1–50 warga untuk setiap pengiriman.' },
        { status: 400 }
      );
    }

    const uniqueRecipientIds = [...new Set(recipientIds)];
    if (uniqueRecipientIds.length !== recipientIds.length) {
      return NextResponse.json({ error: 'Daftar penerima berisi pilihan ganda.' }, { status: 400 });
    }

    const recipients = await prisma.user.findMany({
      where: {
        id: { in: uniqueRecipientIds },
        isActive: true,
        role: { name: 'MASYARAKAT' },
      },
      select: {
        id: true,
        phone: true,
        citizen: { select: { phone: true } },
      },
    });

    if (recipients.length !== uniqueRecipientIds.length) {
      return NextResponse.json(
        { error: 'Sebagian warga tidak ditemukan atau akunnya tidak aktif. Muat ulang daftar warga.' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      recipients.map((recipient) =>
        createNotification({
          userId: recipient.id,
          title: title.trim(),
          message: message.trim(),
          type: 'INFO',
          phone: recipient.phone || recipient.citizen?.phone || null,
        })
      )
    );

    const delivery = {
      sent: results.filter((result) => result?.whatsappStatus === 'SENT').length,
      noPhone: results.filter((result) => result?.whatsappStatus === 'NO_PHONE').length,
      failed: results.filter(
        (result) => result === null || result.whatsappStatus === 'FAILED'
      ).length,
    };

    await logAudit({
      userId: access.user.id,
      userEmail: access.user.email,
      userRole: access.user.role,
      action: 'SEND_SCHEDULE_NOTIFICATION',
      entity: 'Notification',
      details: {
        title: title.trim(),
        recipientCount: recipients.length,
        delivery,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pengumuman tersimpan di aplikasi warga.',
      recipientCount: recipients.length,
      delivery,
    });
  } catch (error) {
    console.error('Send schedule notification error:', error);
    return NextResponse.json({ error: 'Gagal mengirim pengumuman.' }, { status: 500 });
  }
}
