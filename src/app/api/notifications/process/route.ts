import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { sendEmailNotification } from '@/lib/email';
import { sendWhatsAppNotification } from '@/lib/whatsapp';
import { fillTemplate, type ProcessChannel } from '@/lib/notification-templates';

const OFFICER_ROLES = ['STAFF', 'SUPERADMIN', 'KEPALA_DESA'];

async function requireOfficer() {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: 'Silakan login kembali.' }, { status: 401 }) };
  }
  if (!OFFICER_ROLES.includes(user.role)) {
    return { response: NextResponse.json({ error: 'Akses hanya untuk Staf, Superadmin, dan Kepala Desa.' }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  try {
    const access = await requireOfficer();
    if ('response' in access) return access.response;

    const applications = await prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        applicationNumber: true,
        status: true,
        purposeCategory: true,
        currentStaffNote: true,
        currentSuperadminNote: true,
        rejectionReason: true,
        createdAt: true,
        citizen: { select: { fullName: true, phone: true } },
        user: { select: { email: true, phone: true } },
        village: { select: { name: true } },
        generatedDocument: { select: { documentNumber: true } },
      },
    });

    return NextResponse.json({
      applications: applications.map((application) => ({
        id: application.id,
        applicationNumber: application.applicationNumber,
        status: application.status,
        purposeCategory: application.purposeCategory,
        citizenName: application.citizen.fullName,
        phone: application.citizen.phone || application.user.phone || null,
        email: application.user.email,
        villageName: application.village.name,
        documentNumber: application.generatedDocument?.documentNumber || null,
        note:
          application.currentSuperadminNote ||
          application.currentStaffNote ||
          application.rejectionReason ||
          '',
        createdAt: application.createdAt,
      })),
      emailConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    });
  } catch (error) {
    console.error('Fetch process notification applications error:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar pengajuan.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await requireOfficer();
    if ('response' in access) return access.response;

    const body: unknown = await req.json();
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Data notifikasi tidak valid.' }, { status: 400 });
    }

    const { applicationId, channel, subject, message } = body as Record<string, unknown>;
    if (typeof applicationId !== 'string' || !applicationId) {
      return NextResponse.json({ error: 'Pilih pengajuan terlebih dahulu.' }, { status: 400 });
    }
    if (channel !== 'WHATSAPP' && channel !== 'EMAIL') {
      return NextResponse.json({ error: 'Saluran notifikasi harus WhatsApp atau Email.' }, { status: 400 });
    }
    if (typeof message !== 'string' || message.trim().length < 5 || message.trim().length > 2000) {
      return NextResponse.json({ error: 'Isi pesan wajib diisi (5–2.000 karakter).' }, { status: 400 });
    }
    if (channel === 'EMAIL' && (typeof subject !== 'string' || subject.trim().length < 3 || subject.trim().length > 150)) {
      return NextResponse.json({ error: 'Subjek email wajib diisi (3–150 karakter).' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        applicationNumber: true,
        status: true,
        purposeCategory: true,
        currentStaffNote: true,
        currentSuperadminNote: true,
        rejectionReason: true,
        citizen: { select: { fullName: true, phone: true } },
        user: { select: { id: true, email: true, phone: true } },
        village: { select: { name: true } },
        generatedDocument: { select: { documentNumber: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan. Muat ulang daftar.' }, { status: 404 });
    }

    const documentNumber = application.generatedDocument?.documentNumber || '-';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyLink = application.generatedDocument
      ? `${baseUrl}/verify/${application.generatedDocument.documentNumber}`
      : '-';
    const note =
      application.currentSuperadminNote ||
      application.currentStaffNote ||
      application.rejectionReason ||
      '-';

    const templateData = {
      nama: application.citizen.fullName,
      nomor_pengajuan: application.applicationNumber,
      nomor_surat: documentNumber,
      keperluan: application.purposeCategory,
      tanggal: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      catatan: note,
      link_verifikasi: verifyLink,
      desa: application.village.name,
    };

    const finalMessage = fillTemplate(message.trim(), templateData).slice(0, 2000);

    if (channel === 'WHATSAPP') {
      const phone = application.citizen.phone || application.user.phone;
      if (!phone) {
        return NextResponse.json({ error: 'Pemohon tidak memiliki nomor WhatsApp terdaftar.' }, { status: 400 });
      }
      await sendWhatsAppNotification(phone, finalMessage);
    } else {
      const email = application.user.email;
      if (!email) {
        return NextResponse.json({ error: 'Pemohon tidak memiliki alamat email terdaftar.' }, { status: 400 });
      }
      await sendEmailNotification(email, fillTemplate((subject as string).trim(), templateData), finalMessage);
    }

    // Catat juga sebagai notifikasi dalam aplikasi (tanpa kirim WhatsApp ganda).
    const inAppType =
      application.status === 'APPROVED' || application.status === 'COMPLETED' || application.status === 'SUPERADMIN_APPROVED'
        ? 'SUCCESS'
        : application.status === 'NEED_REVISION'
          ? 'WARNING'
          : application.status === 'REJECTED'
            ? 'REJECTED'
            : 'INFO';

    await createNotification({
      userId: application.user.id,
      title: channel === 'WHATSAPP' ? 'Notifikasi WhatsApp' : 'Notifikasi Email',
      message: finalMessage,
      type: inAppType as 'INFO' | 'SUCCESS' | 'WARNING' | 'REJECTED',
      linkUrl: `/dashboard/masyarakat/applications/${application.id}`,
      phone: null,
    });

    await logAudit({
      userId: access.user.id,
      userEmail: access.user.email,
      userRole: access.user.role,
      action: 'SEND_PROCESS_NOTIFICATION',
      entity: 'Notification',
      entityId: application.id,
      details: {
        channel: channel as ProcessChannel,
        applicationNumber: application.applicationNumber,
        applicationStatus: application.status,
        recipientName: application.citizen.fullName,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        channel === 'WHATSAPP'
          ? `Notifikasi WhatsApp terkirim ke ${application.citizen.fullName}.`
          : `Notifikasi email terkirim ke ${application.user.email}.`,
      deliveredTo: channel === 'WHATSAPP' ? application.citizen.phone || application.user.phone : application.user.email,
    });
  } catch (error) {
    console.error('Send process notification error:', error);
    const detail = error instanceof Error ? error.message : 'Gagal mengirim notifikasi proses.';
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
