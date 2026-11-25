import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkApplicationDataWithAi } from '@/lib/ai-assistant';
import { logAudit } from '@/lib/audit';
import { DESA } from '@/lib/desa-config';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const date = searchParams.get('date');

    const where: Record<string, unknown> = {};

    // Role-based visibility
    if (user.role === 'MASYARAKAT') {
      where.userId = user.id;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        { citizen: { fullName: { contains: search } } },
        { citizen: { nik: { contains: search } } },
      ];
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const applications = await prisma.application.findMany({
      where,
      select: {
        id: true,
        applicationNumber: true,
        status: true,
        purposeCategory: true,
        purposeDescription: true,
        currentStaffNote: true,
        currentSuperadminNote: true,
        approvedByHeadAt: true,
        createdAt: true,
        citizen: {
          select: {
            fullName: true,
            nik: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        generatedDocument: {
          select: {
            documentNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Fetch applications error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data pengajuan.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Sesi telah berakhir, silakan login kembali.' }, { status: 401 });
    }

    if (user.role !== 'MASYARAKAT') {
      return NextResponse.json(
        { error: 'Hanya masyarakat yang dapat mengajukan SKTM baru.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      purposeCategory,
      purposeDescription,
      nik,
      noKk,
      fullName,
      birthPlace,
      birthDate,
      gender,
      address,
      rt,
      rw,
      dusun,
      occupation,
      monthlyIncome,
      familyMembersCount,
      houseCondition,
      economicDescription,
      documents, // Array<{ documentType: string, fileName: string, fileUrl: string, fileType: string, fileSize: number, extractedText?: string }>
    } = body;

    if (!purposeCategory || !purposeDescription) {
      return NextResponse.json(
        { error: 'Keperluan SKTM dan rincian keterangan wajib diisi.' },
        { status: 400 }
      );
    }

    // Ensure citizen profile exists or update it
    let citizen = await prisma.citizen.findUnique({
      where: { userId: user.id },
    });

    const defaultVillage = await prisma.village.findFirst();
    const villageId = user.villageId || defaultVillage?.id;

    if (!villageId) {
      return NextResponse.json({ error: 'Data desa sistem belum siap.' }, { status: 500 });
    }

    if (!citizen) {
      citizen = await prisma.citizen.create({
        data: {
          userId: user.id,
          nik: nik || '3201010000000000',
          noKk: noKk || '3201010000000000',
          fullName: fullName || user.name,
          birthPlace: birthPlace || 'Cirebon',
          birthDate: birthDate ? new Date(birthDate) : new Date('1990-01-01'),
          gender: gender || 'LAKI_LAKI',
          address: address || DESA.alamat,
          rt: rt || '001',
          rw: rw || '001',
          dusun: dusun || 'Dusun 1',
          desa: DESA.nama,
          kecamatan: DESA.kecamatan,
          kabupaten: DESA.kabupaten,
          occupation: occupation || 'Buruh',
          monthlyIncome: Number(monthlyIncome) || 1000000,
          familyMembersCount: Number(familyMembersCount) || 3,
          houseCondition: houseCondition || 'Milik Sendiri',
          economicDescription: economicDescription || 'Keluarga berpenghasilan rendah.',
        },
      });
    } else {
      // Update with latest provided form data
      citizen = await prisma.citizen.update({
        where: { id: citizen.id },
        data: {
          nik: nik || citizen.nik,
          noKk: noKk || citizen.noKk,
          fullName: fullName || citizen.fullName,
          birthPlace: birthPlace || citizen.birthPlace,
          birthDate: birthDate ? new Date(birthDate) : citizen.birthDate,
          gender: gender || citizen.gender,
          address: address || citizen.address,
          rt: rt || citizen.rt,
          rw: rw || citizen.rw,
          dusun: dusun || citizen.dusun,
          occupation: occupation || citizen.occupation,
          monthlyIncome: Number(monthlyIncome) || citizen.monthlyIncome,
          familyMembersCount: Number(familyMembersCount) || citizen.familyMembersCount,
          houseCondition: houseCondition || citizen.houseCondition,
          economicDescription: economicDescription || citizen.economicDescription,
        },
      });
    }

    // Run AI Document & Data Checker
    const aiCheck = checkApplicationDataWithAi({
      nik: citizen.nik,
      noKk: citizen.noKk,
      fullName: citizen.fullName,
      monthlyIncome: citizen.monthlyIncome,
      familyMembersCount: citizen.familyMembersCount,
      purposeCategory,
      purposeDescription,
      documents: documents || [],
    });

    // Generate unique application number REQ-YYYYMM-XXXX
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const countThisMonth = await prisma.application.count();
    const appSeq = String(countThisMonth + 1).padStart(4, '0');
    const applicationNumber = `REQ-${yearMonth}-${appSeq}`;

    // Create Application record with initial status "STAFF_REVIEW"
    const newApplication = await prisma.application.create({
      data: {
        applicationNumber,
        userId: user.id,
        citizenId: citizen.id,
        villageId,
        status: 'STAFF_REVIEW',
        purposeCategory,
        purposeDescription,
        aiCompletenessScore: aiCheck.score,
        aiAnalysisResult: JSON.stringify({
          isComplete: aiCheck.isComplete,
          score: aiCheck.score,
          checks: aiCheck.checks,
          warnings: aiCheck.warnings,
          recommendations: aiCheck.recommendations,
          ocrFindings: aiCheck.ocrFindings,
          disclaimer: aiCheck.disclaimer,
        }),
        submittedAt: now,
      },
    });

    // Save uploaded documents
    if (documents && Array.isArray(documents) && documents.length > 0) {
      await prisma.applicationDocument.createMany({
        data: documents.map((doc) => ({
          applicationId: newApplication.id,
          documentType: doc.documentType || 'PENDUKUNG',
          fileName: doc.fileName || 'dokumen.pdf',
          fileUrl: doc.fileUrl || '/uploads/samples/pengantar_sample.pdf',
          fileType: doc.fileType || 'application/pdf',
          fileSize: doc.fileSize || 102400,
          ocrExtractedText: doc.extractedText || null,
          ocrMatchStatus: 'MATCH',
        })),
      });
    }

    // Create status history
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: newApplication.id,
        changedById: user.id,
        previousStatus: 'DRAFT',
        newStatus: 'STAFF_REVIEW',
        actionTitle: 'Pengajuan SKTM Dibuat & Dikirim',
        comment: `Pengajuan berhasil dikirimkan oleh pemohon dengan skor kelengkapan awal AI: ${aiCheck.score}%. Menunggu pemeriksaan staf loket.`,
      },
    });

    // Send notification to applicant
    await createNotification({
      userId: user.id,
      title: 'Pengajuan SKTM Berhasil Dibuat',
      message: `Permohonan SKTM No. ${applicationNumber} telah dikirim ke loket desa dan sedang menunggu pemeriksaan petugas staf.`,
      type: 'INFO',
      linkUrl: `/dashboard/masyarakat/applications/${newApplication.id}`,
    });

    // Record audit log
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE_APPLICATION',
      entity: 'Application',
      entityId: newApplication.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
      details: {
        applicationNumber,
        purposeCategory,
        aiScore: aiCheck.score,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pengajuan SKTM berhasil dibuat dan dikirimkan.',
      application: newApplication,
      aiAssessment: aiCheck,
    });
  } catch (error) {
    console.error('Submit application error:', error);
    return NextResponse.json(
      { error: 'Terjadi kegagalan dalam mengirimkan pengajuan.' },
      { status: 500 }
    );
  }
}
