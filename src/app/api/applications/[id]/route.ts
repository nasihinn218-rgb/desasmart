import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses.' }, { status: 401 });
    }

    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        citizen: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        village: true,
        documents: true,
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        statusHistories: {
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                role: { select: { name: true, displayName: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        generatedDocument: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan.' }, { status: 404 });
    }

    // Role check: Masyarakat can only view their own application
    if (user.role === 'MASYARAKAT' && application.userId !== user.id) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki hak akses melihat pengajuan ini.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Fetch application detail error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail pengajuan.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const application = await prisma.application.findUnique({
      where: { id },
      include: { citizen: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan.' }, { status: 404 });
    }

    // Only applicant can edit if in NEED_REVISION or DRAFT
    if (application.userId !== user.id) {
      return NextResponse.json({ error: 'Hanya pemohon yang dapat merevisi berkas.' }, { status: 403 });
    }

    if (application.status !== 'NEED_REVISION' && application.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Pengajuan ini sedang diproses dan tidak dapat diubah.' },
        { status: 400 }
      );
    }

    const {
      purposeDescription,
      monthlyIncome,
      familyMembersCount,
      economicDescription,
      documents,
    } = body;

    // Update citizen economic data
    await prisma.citizen.update({
      where: { id: application.citizenId },
      data: {
        monthlyIncome: monthlyIncome !== undefined ? Number(monthlyIncome) : undefined,
        familyMembersCount: familyMembersCount !== undefined ? Number(familyMembersCount) : undefined,
        economicDescription: economicDescription !== undefined ? economicDescription : undefined,
      },
    });

    // Update application and change status back to STAFF_REVIEW
    const updatedApp = await prisma.application.update({
      where: { id },
      data: {
        purposeDescription: purposeDescription || application.purposeDescription,
        status: 'STAFF_REVIEW',
        revisionNotes: null,
      },
    });

    // If new documents provided, add them
    if (documents && Array.isArray(documents) && documents.length > 0) {
      await prisma.applicationDocument.deleteMany({
        where: { applicationId: id },
      });

      await prisma.applicationDocument.createMany({
        data: documents.map((doc: any) => ({
          applicationId: id,
          documentType: doc.documentType || 'PENDUKUNG',
          fileName: doc.fileName || 'dokumen_perbaikan.pdf',
          fileUrl: doc.fileUrl || '/uploads/samples/kk_sample.pdf',
          fileType: doc.fileType || 'application/pdf',
          fileSize: doc.fileSize || 102400,
          ocrExtractedText: doc.extractedText || null,
          ocrMatchStatus: 'MATCH',
        })),
      });
    }

    // Log status history
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: id,
        changedById: user.id,
        previousStatus: 'NEED_REVISION',
        newStatus: 'STAFF_REVIEW',
        actionTitle: 'Perbaikan Berkas Dikirim Ulang',
        comment: 'Pemohon telah memperbarui berkas dan mengirimkan kembali permohonan ke loket staf desa.',
      },
    });

    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE_APPLICATION',
      entity: 'Application',
      entityId: id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
      details: { action: 'RESUBMIT_REVISION' },
    });

    return NextResponse.json({
      success: true,
      message: 'Perbaikan berhasil dikirimkan kembali.',
      application: updatedApp,
    });
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui pengajuan.' },
      { status: 500 }
    );
  }
}
