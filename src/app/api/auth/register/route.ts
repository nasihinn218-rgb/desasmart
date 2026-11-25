import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { issueOtpForUser } from '@/lib/otp';
import { DESA } from '@/lib/desa-config';
import { createToken, createBackupToken, COOKIE_NAME, BACKUP_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      name,
      phone,
      nik,
      noKk,
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
    } = body;

    // Validation
    if (!email || !password || !name || !nik || !noKk) {
      return NextResponse.json(
        { error: 'Email, password, nama lengkap, NIK, dan Nomor KK wajib diisi.' },
        { status: 400 }
      );
    }

    if (!/^\d{16}$/.test(nik)) {
      return NextResponse.json(
        { error: 'Format NIK harus tepat 16 digit angka.' },
        { status: 400 }
      );
    }

    if (!/^\d{16}$/.test(noKk)) {
      return NextResponse.json(
        { error: 'Format Nomor KK harus tepat 16 digit angka.' },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email tersebut sudah terdaftar di sistem.' },
        { status: 400 }
      );
    }

    // Check duplicate NIK
    const existingCitizen = await prisma.citizen.findUnique({
      where: { nik: nik.trim() },
    });
    if (existingCitizen) {
      return NextResponse.json(
        { error: 'NIK tersebut sudah terdaftar di sistem.' },
        { status: 400 }
      );
    }

    // Find default role and village
    const roleMasyarakat = await prisma.role.findUnique({
      where: { name: 'MASYARAKAT' },
    });
    if (!roleMasyarakat) {
      return NextResponse.json({ error: 'Role sistem belum diinisialisasi.' }, { status: 500 });
    }

    const defaultVillage = await prisma.village.findFirst();

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        phone: phone || null,
        roleId: roleMasyarakat.id,
        villageId: defaultVillage?.id || null,
        isVerified: false, // Memerlukan verifikasi kode OTP
        citizen: {
          create: {
            nik: nik.trim(),
            noKk: noKk.trim(),
            fullName: name.trim(),
            birthPlace: birthPlace || 'Cirebon',
            birthDate: birthDate ? new Date(birthDate) : new Date('1995-01-01'),
            gender: gender || 'LAKI_LAKI',
            phone: phone || null,
            address: address || DESA.alamat,
            rt: rt || '001',
            rw: rw || '001',
            dusun: dusun || 'Dusun Wage',
            desa: defaultVillage?.name || DESA.nama,
            kecamatan: defaultVillage?.district || DESA.kecamatan,
            kabupaten: defaultVillage?.regency || DESA.kabupaten,
            occupation: occupation || 'Wiraswasta / Belum Bekerja',
            monthlyIncome: Number(monthlyIncome) || 1000000,
            familyMembersCount: Number(familyMembersCount) || 3,
            houseCondition: houseCondition || 'Milik Sendiri',
            economicDescription: economicDescription || 'Penghasilan harian lepas.',
          },
        },
      },
      include: {
        citizen: true,
      },
    });

    // Kirim notifikasi / kode OTP konfirmasi via WhatsApp & Email
    let delivery: { whatsapp: boolean; email: boolean; code?: string } | null = null;
    let deliveryMessage = 'Kode OTP verifikasi telah dikirim ke WhatsApp dan Email Anda.';
    try {
      delivery = await issueOtpForUser({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
      });
      const isDelivered = delivery.whatsapp || delivery.email;
      const channels = [delivery.whatsapp && 'WhatsApp', delivery.email && 'Email'].filter(Boolean).join(' & ');
      if (isDelivered) {
        deliveryMessage = `Pendaftaran berhasil. Kode OTP telah dikirim ke ${channels}.`;
      }
    } catch (otpError) {
      console.error('OTP initial delivery failed:', otpError);
    }

    // Record audit log
    await logAudit({
      userId: newUser.id,
      userEmail: newUser.email,
      userRole: 'MASYARAKAT',
      action: 'REGISTER',
      entity: 'User',
      entityId: newUser.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
      details: { nik, otpDelivery: delivery },
    });

    const backupToken = createBackupToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      passwordHash: hashedPassword,
      role: 'MASYARAKAT',
      phone: newUser.phone,
      nik: nik.trim(),
      noKk: noKk.trim(),
      birthPlace,
      birthDate,
      gender,
      address,
      rt,
      rw,
      dusun,
      occupation,
      monthlyIncome: Number(monthlyIncome),
      familyMembersCount: Number(familyMembersCount),
      houseCondition,
      economicDescription,
    });

    const isSecure =
      process.env.NODE_ENV === 'production' ||
      req.headers.get('x-forwarded-proto') === 'https' ||
      (process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') ?? false);

    const response = NextResponse.json({
      success: true,
      requiresVerification: true,
      email: newUser.email,
      otpCode: process.env.NODE_ENV === 'development' || !delivery?.whatsapp ? delivery?.code : undefined,
      message: deliveryMessage,
      delivery,
    });

    // Set cookie backup identitas pengguna agar tidak hilang antar instance serverless
    response.cookies.set(BACKUP_COOKIE_NAME, backupToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat pendaftaran akun.' },
      { status: 500 }
    );
  }
}
