import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSktmPdfBuffer } from '@/lib/pdf-generator';
import { logAudit } from '@/lib/audit';
import { DESA, DESA_ALAMAT_LENGKAP } from '@/lib/desa-config';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Silakan login untuk mengunduh dokumen.' }, { status: 401 });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        citizen: true,
        village: true,
        generatedDocument: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan.' }, { status: 404 });
    }

    if (application.status !== 'COMPLETED' || !application.generatedDocument) {
      return NextResponse.json(
        { error: 'Dokumen SKTM hanya dapat diunduh setelah disetujui dan diterbitkan.' },
        { status: 400 }
      );
    }

    // Role security check
    if (user.role === 'MASYARAKAT' && application.userId !== user.id) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const citizen = application.citizen;
    const village = application.village;
    const genDoc = application.generatedDocument;

    const bDate = new Date(citizen.birthDate);
    const birthDateFormatted = `${bDate.getDate()} ${MONTH_NAMES[bDate.getMonth()]} ${bDate.getFullYear()}`;

    const iDate = new Date(genDoc.issuedDate);
    const issuedDateFormatted = `${iDate.getDate()} ${MONTH_NAMES[iDate.getMonth()]} ${iDate.getFullYear()}`;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify/${encodeURIComponent(genDoc.documentNumber)}`;

    const pdfBuffer = await generateSktmPdfBuffer({
      documentNumber: genDoc.documentNumber,
      applicantName: citizen.fullName,
      nik: citizen.nik,
      noKk: citizen.noKk,
      birthPlace: citizen.birthPlace,
      birthDate: birthDateFormatted,
      gender: citizen.gender,
      occupation: citizen.occupation,
      address: `${citizen.address}, RT ${citizen.rt} / RW ${citizen.rw}, ${citizen.dusun}, ${citizen.desa}`,
      purposeCategory: application.purposeCategory,
      purposeDescription: application.purposeDescription,
      villageName: village?.name || DESA.nama,
      districtName: village?.district || DESA.kecamatan,
      regencyName: village?.regency || DESA.kabupaten,
      villageAddress: village?.address || DESA_ALAMAT_LENGKAP,
      villagePhone: village?.phone || DESA.telepon,
      headVillageName: village?.headVillageName || genDoc.signedByName || DESA.kepalaDesaName,
      headVillageNip: village?.headVillageNip || undefined,
      issuedDate: issuedDateFormatted,
      verificationUrl,
    });

    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DOWNLOAD_DOCUMENT',
      entity: 'GeneratedDocument',
      entityId: genDoc.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
      details: { documentNumber: genDoc.documentNumber },
    });

    const safeFilename = genDoc.documentNumber.replace(/[\/\\:]/g, '_');
    const pdfBody = new ArrayBuffer(pdfBuffer.byteLength);
    new Uint8Array(pdfBody).set(pdfBuffer);

    const displayMode = new URL(req.url).searchParams.get('display');
    const dispositionType = displayMode === 'inline' ? 'inline' : 'attachment';

    return new NextResponse(pdfBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${dispositionType}; filename="SKTM_${safeFilename}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Generate PDF error:', error);
    return NextResponse.json(
      { error: 'Gagal mencetak dokumen SKTM.' },
      { status: 500 }
    );
  }
}
