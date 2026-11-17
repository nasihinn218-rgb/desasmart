import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { DESA } from '@/lib/desa-config';

interface RouteParams {
  params: Promise<{ documentNumber: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { documentNumber } = await params;
    const decodedNumber = decodeURIComponent(documentNumber);

    const generatedDoc = await prisma.generatedDocument.findFirst({
      where: {
        documentNumber: decodedNumber,
      },
      include: {
        application: {
          include: {
            citizen: true,
            village: true,
          },
        },
      },
    });

    if (!generatedDoc) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Nomor dokumen SKTM tidak ditemukan atau belum terdaftar dalam sistem resmi desa.',
        },
        { status: 404 }
      );
    }

    const citizen = generatedDoc.application.citizen;
    const village = generatedDoc.application.village;

    // Mask NIK for privacy protection (e.g., 320101******0001)
    const rawNik = citizen.nik;
    const maskedNik =
      rawNik.length === 16
        ? `${rawNik.substring(0, 6)}******${rawNik.substring(12)}`
        : '****************';

    // Mask name partially if desired (e.g. Ahmad D*****)
    const nameParts = citizen.fullName.split(' ');
    const maskedName = nameParts
      .map((part, idx) => (idx === 0 ? part : `${part[0]}***`))
      .join(' ');

    await logAudit({
      action: 'PUBLIC_VERIFY',
      entity: 'GeneratedDocument',
      entityId: generatedDoc.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
      details: { documentNumber: decodedNumber },
    });

    return NextResponse.json({
      valid: generatedDoc.isValid,
      documentNumber: generatedDoc.documentNumber,
      title: generatedDoc.title,
      applicantName: maskedName,
      maskedNik,
      villageName: village?.name || DESA.nama,
      districtName: village?.district || DESA.kecamatan,
      regencyName: village?.regency || DESA.kabupaten,
      issuedDate: generatedDoc.issuedDate,
      signedByName: generatedDoc.signedByName,
      signedByTitle: generatedDoc.signedByTitle,
      purposeCategory: generatedDoc.application.purposeCategory,
      documentHash: generatedDoc.documentHash.substring(0, 16) + '...',
      status: 'TERVERIFIKASI ASLI & RESMI',
    });
  } catch (error) {
    console.error('Verify document error:', error);
    return NextResponse.json(
      { error: 'Terjadi kegagalan memverifikasi dokumen.' },
      { status: 500 }
    );
  }
}
