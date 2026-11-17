import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses.' }, { status: 401 });
    }

    const { id } = await params;
    const { action, notes, reason } = await req.json();

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        citizen: true,
        village: true,
        user: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan.' }, { status: 404 });
    }

    // Role-based permission checks & state transitions
    let newStatus = application.status;
    let actionTitle = '';
    let notificationTitle = '';
    let notificationMessage = '';
    let notificationType: 'INFO' | 'SUCCESS' | 'WARNING' | 'REJECTED' = 'INFO';

    // 1. STAFF WORKFLOW
    if (user.role === 'STAFF') {
      if (application.status !== 'STAFF_REVIEW') {
        return NextResponse.json(
          { error: 'Staf hanya dapat memproses pengajuan yang sedang menunggu pemeriksaan loket.' },
          { status: 400 }
        );
      }

      if (action === 'REQUEST_REVISION') {
        if (!notes) {
          return NextResponse.json({ error: 'Catatan perbaikan wajib diisi.' }, { status: 400 });
        }
        newStatus = 'NEED_REVISION';
        actionTitle = 'Staf Mengembalikan Pengajuan (Perlu Perbaikan)';
        notificationTitle = 'Pengajuan Perlu Perbaikan';
        notificationMessage = `Staf desa meminta perbaikan pada pengajuan ${application.applicationNumber}: "${notes}"`;
        notificationType = 'WARNING';

        await prisma.application.update({
          where: { id },
          data: {
            status: newStatus,
            revisionNotes: notes,
            currentStaffNote: notes,
          },
        });
      } else if (action === 'FORWARD_SUPERADMIN') {
        newStatus = 'SUPERADMIN_REVIEW';
        actionTitle = 'Staf Meneruskan ke Superadmin';
        notificationTitle = 'Pemeriksaan Staf Selesai';
        notificationMessage = `Pengajuan ${application.applicationNumber} telah dinyatakan lengkap oleh staf loket dan diteruskan ke Kasi Pelayanan/Superadmin.`;
        notificationType = 'INFO';

        await prisma.application.update({
          where: { id },
          data: {
            status: newStatus,
            currentStaffNote: notes || 'Pemeriksaan staf selesai dan berkas lengkap.',
            reviewedByStaffAt: new Date(),
          },
        });
      } else {
        return NextResponse.json({ error: 'Aksi staf tidak valid.' }, { status: 400 });
      }
    }

    // 2. SUPERADMIN WORKFLOW
    else if (user.role === 'SUPERADMIN') {
      if (application.status !== 'SUPERADMIN_REVIEW') {
        return NextResponse.json(
          { error: 'Pengajuan belum selesai diperiksa oleh staf loket.' },
          { status: 400 }
        );
      }

      if (action === 'SUPERADMIN_APPROVE') {
        newStatus = 'HEAD_REVIEW';
        actionTitle = 'Superadmin Menyetujui & Meneruskan ke Kepala Desa';
        notificationTitle = 'Verifikasi Superadmin Disetujui';
        notificationMessage = `Pengajuan ${application.applicationNumber} telah diverifikasi oleh Superadmin dan kini menunggu tanda tangan Kepala Desa.`;
        notificationType = 'INFO';

        await prisma.application.update({
          where: { id },
          data: {
            status: newStatus,
            currentSuperadminNote: notes || 'Verifikasi superadmin selesai dan disetujui.',
            reviewedBySuperadminAt: new Date(),
          },
        });
      } else if (action === 'SUPERADMIN_REJECT') {
        if (!reason && !notes) {
          return NextResponse.json({ error: 'Alasan penolakan wajib disertakan.' }, { status: 400 });
        }
        newStatus = 'REJECTED';
        actionTitle = 'Superadmin Menolak Pengajuan';
        notificationTitle = 'Pengajuan Ditolak oleh Superadmin';
        notificationMessage = `Pengajuan ${application.applicationNumber} ditolak oleh Superadmin dengan alasan: "${reason || notes}"`;
        notificationType = 'REJECTED';

        await prisma.application.update({
          where: { id },
          data: {
            status: newStatus,
            rejectionReason: reason || notes,
            currentSuperadminNote: reason || notes,
          },
        });
      } else if (action === 'SUPERADMIN_RETURN') {
        if (!notes) {
          return NextResponse.json({ error: 'Catatan perbaikan wajib diisi.' }, { status: 400 });
        }
        newStatus = 'NEED_REVISION';
        actionTitle = 'Superadmin Mengembalikan Pengajuan untuk Perbaikan';
        notificationTitle = 'Pengajuan Dikembalikan Superadmin';
        notificationMessage = `Superadmin meminta perbaikan berkas pada pengajuan ${application.applicationNumber}: "${notes}"`;
        notificationType = 'WARNING';

        await prisma.application.update({
          where: { id },
          data: {
            status: newStatus,
            revisionNotes: notes,
            currentSuperadminNote: notes,
          },
        });
      } else {
        return NextResponse.json({ error: 'Aksi superadmin tidak valid.' }, { status: 400 });
      }
    }

    // 3. KEPALA DESA WORKFLOW
    else if (user.role === 'KEPALA_DESA') {
      if (application.status !== 'HEAD_REVIEW') {
        return NextResponse.json(
          { error: 'Pengajuan harus diverifikasi terlebih dahulu oleh Superadmin sebelum disetujui Kepala Desa.' },
          { status: 400 }
        );
      }

      if (action === 'HEAD_APPROVE') {
        newStatus = 'COMPLETED';
        actionTitle = 'Kepala Desa Menyetujui & SKTM Diterbitkan';

        const now = new Date();
        const monthRoman = ROMAN_MONTHS[now.getMonth()];
        const year = now.getFullYear();

        // Count generated documents this year to format number: 470/XXX/SKTM/BULAN/TAHUN
        const totalGeneratedThisYear = await prisma.generatedDocument.count();
        const seqNumber = String(totalGeneratedThisYear + 1).padStart(3, '0');
        const documentNumber = `470/${seqNumber}/SKTM/${monthRoman}/${year}`;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/verify/${encodeURIComponent(documentNumber)}`;

        // Hash for tamper verification
        const hashInput = `${documentNumber}-${application.citizen.nik}-${now.toISOString()}`;
        const documentHash = crypto.createHash('sha256').update(hashInput).digest('hex');

        // Create GeneratedDocument record
        await prisma.generatedDocument.upsert({
          where: { applicationId: id },
          update: {
            documentNumber,
            qrCodeData: verificationUrl,
            signedByName: application.village?.headVillageName || user.name,
            issuedDate: now,
            documentHash,
            isValid: true,
          },
          create: {
            applicationId: id,
            documentNumber,
            title: 'SURAT KETERANGAN TIDAK MAMPU',
            qrCodeData: verificationUrl,
            signedByName: application.village?.headVillageName || user.name,
            signedByTitle: 'Kepala Desa',
            issuedDate: now,
            pdfUrl: `/api/applications/${id}/pdf`,
            documentHash,
            isValid: true,
          },
        });

        await prisma.application.update({
          where: { id },
          data: {
            status: newStatus,
            approvedByHeadAt: now,
            completedAt: now,
          },
        });

        notificationTitle = 'SKTM Anda Telah Diterbitkan!';
        notificationMessage = `Selamat, permohonan SKTM Anda telah disetujui oleh Kepala Desa dengan Nomor Surat: ${documentNumber}. Dokumen resmi ber-QR Code sudah dapat Anda unduh.`;
        notificationType = 'SUCCESS';

        // Log document generation audit
        await logAudit({
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          action: 'GENERATE_PDF',
          entity: 'GeneratedDocument',
          entityId: id,
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent'),
          details: { documentNumber },
        });
      } else if (action === 'HEAD_REJECT') {
        if (!reason && !notes) {
          return NextResponse.json({ error: 'Alasan penolakan wajib disertakan.' }, { status: 400 });
        }
        newStatus = 'REJECTED';
        actionTitle = 'Kepala Desa Menolak Pengajuan';
        notificationTitle = 'Pengajuan Ditolak Kepala Desa';
        notificationMessage = `Pengajuan ${application.applicationNumber} ditolak oleh Kepala Desa dengan alasan: "${reason || notes}"`;
        notificationType = 'REJECTED';

        await prisma.application.update({
          where: { id },
          data: {
            status: newStatus,
            rejectionReason: reason || notes,
          },
        });
      } else {
        return NextResponse.json({ error: 'Aksi Kepala Desa tidak valid.' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Role Anda tidak memiliki wewenang review.' }, { status: 403 });
    }

    // Save ApplicationReview record
    await prisma.applicationReview.create({
      data: {
        applicationId: id,
        reviewerId: user.id,
        reviewerRole: user.role,
        action,
        notes: notes || reason || null,
      },
    });

    // Save ApplicationStatusHistory record
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: id,
        changedById: user.id,
        previousStatus: application.status,
        newStatus,
        actionTitle,
        comment: notes || reason || `${user.role} melakukan aksi ${action}`,
      },
    });

    // Send Notification to applicant
    await createNotification({
      userId: application.userId,
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      linkUrl: `/dashboard/masyarakat/applications/${id}`,
    });

    // Log audit log
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: `${user.role}_${action}`,
      entity: 'Application',
      entityId: id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
      details: {
        previousStatus: application.status,
        newStatus,
        action,
        notes: notes || reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Aksi berhasil diproses.',
      status: newStatus,
    });
  } catch (error) {
    console.error('Review application error:', error);
    return NextResponse.json(
      { error: 'Terjadi kegagalan saat memproses review pengajuan.' },
      { status: 500 }
    );
  }
}
