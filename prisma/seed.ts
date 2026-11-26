import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { syncDesaWilayah } from '../src/lib/wilayah';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning database ---');
  await prisma.auditLog.deleteMany();
  await prisma.generatedDocument.deleteMany();
  await prisma.aiMessage.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.applicationStatusHistory.deleteMany();
  await prisma.applicationReview.deleteMany();
  await prisma.applicationDocument.deleteMany();
  await prisma.application.deleteMany();
  await prisma.citizen.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rukunTetangga.deleteMany();
  await prisma.rukunWarga.deleteMany();
  await prisma.village.deleteMany();
  await prisma.role.deleteMany();

  console.log('--- Seeding Roles ---');
  const roleMasyarakat = await prisma.role.create({
    data: {
      name: 'MASYARAKAT',
      displayName: 'Masyarakat / Pemohon',
      description: 'Pengguna umum warga desa yang mengajukan layanan administrasi dan SKTM',
    },
  });

  const roleStaff = await prisma.role.create({
    data: {
      name: 'STAFF',
      displayName: 'Staf Pelayanan Desa',
      description: 'Petugas loket pelayanan yang memeriksa kelengkapan data & berkas',
    },
  });

  const roleSuperadmin = await prisma.role.create({
    data: {
      name: 'SUPERADMIN',
      displayName: 'Superadmin / Kasi Pelayanan',
      description: 'Pejabat verifikator yang memverifikasi keabsahan data dan rekomendasi staf',
    },
  });

  const roleKepalaDesa = await prisma.role.create({
    data: {
      name: 'KEPALA_DESA',
      displayName: 'Kepala Desa',
      description: 'Pimpinan desa yang memberikan persetujuan akhir penerbitan SKTM',
    },
  });

  console.log('--- Seeding Village ---');
  const village = await prisma.village.create({
    data: {
      name: 'Desa Silihasih',
      code: '3209212001',
      district: 'Kecamatan Pabedilan',
      regency: 'Kabupaten Cirebon',
      province: 'Jawa Barat',
      postalCode: '45193',
      address: 'Jl. Mayjen Sutoyo',
      phone: '(0231) 876-5432',
      email: 'pelayanan@silihasih.desa.id',
      website: 'https://silihasih.desa.id',
      headVillageName: 'Drs. H. Mulyadi, M.Si',
      headVillageNip: '19740512 199803 1 002',
    },
  });

  console.log('--- Seeding Wilayah RW/RT ---');
  const wilayah = await syncDesaWilayah(village.id, prisma);
  console.log(
    `${wilayah.rw} RW dan ${wilayah.rt} RT resmi Desa Silihasih tersimpan di rukun_warga & rukun_tetangga.`
  );

  console.log('--- Seeding Users ---');
  const hashedPassword = bcrypt.hashSync('Password123!', 10);

  // 1. Kepala Desa
  const userKades = await prisma.user.create({
    data: {
      email: 'h.mulyadi@gmail.go.id',
      password: hashedPassword,
      name: 'Drs. H. Mulyadi, M.Si',
      phone: '081298765431',
      roleId: roleKepalaDesa.id,
      villageId: village.id,
      isActive: true,
    },
  });

  // 2. Superadmin
  const userSuperadmin = await prisma.user.create({
    data: {
      email: 'budi.santoso@gmail.go.id',
      password: hashedPassword,
      name: 'Budi Santoso, S.Sos',
      phone: '081298765432',
      roleId: roleSuperadmin.id,
      villageId: village.id,
      isActive: true,
    },
  });

  // 3. Staf Desa
  const userStaff = await prisma.user.create({
    data: {
      email: 'siti.rahmawati@gmail.go.id',
      password: hashedPassword,
      name: 'Siti Rahmawati, A.Md',
      phone: '081298765433',
      roleId: roleStaff.id,
      villageId: village.id,
      isActive: true,
    },
  });

  // 4. Masyarakat (Demo User)
  const userMasyarakat = await prisma.user.create({
    data: {
      email: 'masyarakat@desa.test',
      password: hashedPassword,
      name: 'Ahmad Dahlan',
      phone: '081387654321',
      roleId: roleMasyarakat.id,
      villageId: village.id,
      isActive: true,
    },
  });

  // Citizen Profile for Ahmad Dahlan
  const citizenAhmad = await prisma.citizen.create({
    data: {
      userId: userMasyarakat.id,
      nik: '3201011504920001',
      noKk: '3201012908050002',
      fullName: 'Ahmad Dahlan',
      birthPlace: 'Cirebon',
      birthDate: new Date('1992-04-15'),
      gender: 'LAKI_LAKI',
      phone: '081387654321',
      address: 'Kp. Babakan RT 003 / RW 001, Dusun Wage',
      rt: '003',
      rw: '001',
      dusun: 'Dusun Wage',
      desa: 'Desa Silihasih',
      kecamatan: 'Kecamatan Pabedilan',
      kabupaten: 'Kabupaten Cirebon',
      occupation: 'Buruh Harian Lepas',
      monthlyIncome: 1200000,
      familyMembersCount: 4,
      houseCondition: 'Menumpang di rumah orang tua, dinding semi permanen',
      economicDescription: 'Bekerja serabutan buruh harian lepas dengan penghasilan tidak menentu untuk menghidupi 1 istri dan 2 anak usia sekolah.',
    },
  });

  // Additional demo citizens for realistic application queues
  const userWarga2 = await prisma.user.create({
    data: {
      email: 'warga2@desa.test',
      password: hashedPassword,
      name: 'Dewi Sartika',
      phone: '081311223344',
      roleId: roleMasyarakat.id,
      villageId: village.id,
      isActive: true,
    },
  });

  const citizenDewi = await prisma.citizen.create({
    data: {
      userId: userWarga2.id,
      nik: '3201014809900005',
      noKk: '3201011204090008',
      fullName: 'Dewi Sartika',
      birthPlace: 'Cirebon',
      birthDate: new Date('1990-09-08'),
      gender: 'PEREMPUAN',
      phone: '081311223344',
      address: 'Jl. Melati Kp. Tengah RT 001 / RW 001, Dusun Wage',
      rt: '001',
      rw: '001',
      dusun: 'Dusun Wage',
      desa: 'Desa Silihasih',
      kecamatan: 'Kecamatan Pabedilan',
      kabupaten: 'Kabupaten Cirebon',
      occupation: 'Pedagang Keliling',
      monthlyIncome: 950000,
      familyMembersCount: 3,
      houseCondition: 'Sewa kontrakan 1 petak',
      economicDescription: 'Orang tua tunggal menghidupi 2 anak, jualan gorengan keliling dengan penghasilan tidak menentu.',
    },
  });

  const userWarga3 = await prisma.user.create({
    data: {
      email: 'warga3@desa.test',
      password: hashedPassword,
      name: 'Herman Prasetyo',
      phone: '081255667788',
      roleId: roleMasyarakat.id,
      villageId: village.id,
      isActive: true,
      isVerified: true,
    },
  });

  const citizenHerman = await prisma.citizen.create({
    data: {
      userId: userWarga3.id,
      nik: '3201012301850003',
      noKk: '3201011505080004',
      fullName: 'Herman Prasetyo',
      birthPlace: 'Cianjur',
      birthDate: new Date('1985-01-23'),
      gender: 'LAKI_LAKI',
      phone: '081255667788',
      address: 'Kp. Pabuaran RT 004 / RW 002, Dusun Wage',
      rt: '004',
      rw: '002',
      dusun: 'Dusun Wage',
      desa: 'Desa Silihasih',
      kecamatan: 'Kecamatan Pabedilan',
      kabupaten: 'Kabupaten Cirebon',
      occupation: 'Petani Penggarap',
      monthlyIncome: 1100000,
      familyMembersCount: 5,
      houseCondition: 'Rumah bilik sederhana peninggalan keluarga',
      economicDescription: 'Menggarap lahan sawah sewa musiman, membutuhkan bantuan keringanan biaya pengobatan rawat inap puskesmas.',
    },
  });

  // Warga 4: James
  const userJames = await prisma.user.create({
    data: {
      email: 'edunasihin@gmail.com',
      password: hashedPassword,
      name: 'James',
      phone: '081298765432',
      roleId: roleMasyarakat.id,
      villageId: village.id,
      isActive: true,
      isVerified: true,
    },
  });
  await prisma.citizen.create({
    data: {
      userId: userJames.id,
      nik: '3209211204950004',
      noKk: '3209210101900004',
      fullName: 'James',
      birthPlace: 'Cirebon',
      birthDate: new Date('1995-04-12'),
      gender: 'LAKI_LAKI',
      phone: '081298765432',
      address: 'Desa Silihasih RT 002 / RW 001, Dusun Wage',
      rt: '002',
      rw: '001',
      dusun: 'Dusun Wage',
      desa: 'Desa Silihasih',
      kecamatan: 'Kecamatan Pabedilan',
      kabupaten: 'Kabupaten Cirebon',
      occupation: 'Wiraswasta',
      monthlyIncome: 1200000,
      familyMembersCount: 4,
      houseCondition: 'Milik Sendiri',
      economicDescription: 'Keluarga warga Desa Silihasih.',
    },
  });

  // Warga 5: Wildan Prastio
  const userWildan = await prisma.user.create({
    data: {
      email: 'prastiowildan15@gmail.com',
      password: hashedPassword,
      name: 'Wildan Prastio',
      phone: '081388990011',
      roleId: roleMasyarakat.id,
      villageId: village.id,
      isActive: true,
      isVerified: true,
    },
  });
  await prisma.citizen.create({
    data: {
      userId: userWildan.id,
      nik: '3209212006930005',
      noKk: '3209210101900005',
      fullName: 'Wildan Prastio',
      birthPlace: 'Cirebon',
      birthDate: new Date('1993-06-20'),
      gender: 'LAKI_LAKI',
      phone: '081388990011',
      address: 'Desa Silihasih RT 005 / RW 002, Dusun Wage',
      rt: '005',
      rw: '002',
      dusun: 'Dusun Wage',
      desa: 'Desa Silihasih',
      kecamatan: 'Kecamatan Pabedilan',
      kabupaten: 'Kabupaten Cirebon',
      occupation: 'Karyawan Swasta',
      monthlyIncome: 1500000,
      familyMembersCount: 3,
      houseCondition: 'Milik Sendiri',
      economicDescription: 'Keluarga warga Desa Silihasih.',
    },
  });

  // Warga 6: Ikin Nasihin
  const userIkin = await prisma.user.create({
    data: {
      email: 'ikin11886@gmail.com',
      password: hashedPassword,
      name: 'Ikin Nasihin',
      phone: '081223344556',
      roleId: roleMasyarakat.id,
      villageId: village.id,
      isActive: true,
      isVerified: true,
    },
  });
  await prisma.citizen.create({
    data: {
      userId: userIkin.id,
      nik: '3209210808980006',
      noKk: '3209210101900006',
      fullName: 'Ikin Nasihin',
      birthPlace: 'Cirebon',
      birthDate: new Date('1998-08-08'),
      gender: 'LAKI_LAKI',
      phone: '081223344556',
      address: 'Desa Silihasih RT 003 / RW 001, Dusun Wage',
      rt: '003',
      rw: '001',
      dusun: 'Dusun Wage',
      desa: 'Desa Silihasih',
      kecamatan: 'Kecamatan Pabedilan',
      kabupaten: 'Kabupaten Cirebon',
      occupation: 'Wiraswasta',
      monthlyIncome: 1200000,
      familyMembersCount: 4,
      houseCondition: 'Milik Sendiri',
      economicDescription: 'Keluarga warga Desa Silihasih.',
    },
  });

  // Warga 7: Siti Aminah
  const userSiti = await prisma.user.create({
    data: {
      email: 'siti.aminah@desa.test',
      password: hashedPassword,
      name: 'Siti Aminah',
      phone: '081344556677',
      roleId: roleMasyarakat.id,
      villageId: village.id,
      isActive: true,
      isVerified: true,
    },
  });
  await prisma.citizen.create({
    data: {
      userId: userSiti.id,
      nik: '3209214502940007',
      noKk: '3209210101900007',
      fullName: 'Siti Aminah',
      birthPlace: 'Cirebon',
      birthDate: new Date('1994-02-15'),
      gender: 'PEREMPUAN',
      phone: '081344556677',
      address: 'Desa Silihasih RT 007 / RW 003, Dusun Kliwon',
      rt: '007',
      rw: '003',
      dusun: 'Dusun Kliwon',
      desa: 'Desa Silihasih',
      kecamatan: 'Kecamatan Pabedilan',
      kabupaten: 'Kabupaten Cirebon',
      occupation: 'Ibu Rumah Tangga',
      monthlyIncome: 1000000,
      familyMembersCount: 4,
      houseCondition: 'Milik Sendiri',
      economicDescription: 'Keluarga warga Desa Silihasih.',
    },
  });

  // Warga 8: Rahmat Hidayat
  const userRahmat = await prisma.user.create({
    data: {
      email: 'rahmat.hidayat@desa.test',
      password: hashedPassword,
      name: 'Rahmat Hidayat',
      phone: '081266778899',
      roleId: roleMasyarakat.id,
      villageId: village.id,
      isActive: true,
      isVerified: true,
    },
  });
  await prisma.citizen.create({
    data: {
      userId: userRahmat.id,
      nik: '3209211003910008',
      noKk: '3209210101900008',
      fullName: 'Rahmat Hidayat',
      birthPlace: 'Cirebon',
      birthDate: new Date('1991-03-10'),
      gender: 'LAKI_LAKI',
      phone: '081266778899',
      address: 'Desa Silihasih RT 008 / RW 003, Dusun Kliwon',
      rt: '008',
      rw: '003',
      dusun: 'Dusun Kliwon',
      desa: 'Desa Silihasih',
      kecamatan: 'Kecamatan Pabedilan',
      kabupaten: 'Kabupaten Cirebon',
      occupation: 'Pedagang',
      monthlyIncome: 1100000,
      familyMembersCount: 3,
      houseCondition: 'Milik Sendiri',
      economicDescription: 'Keluarga warga Desa Silihasih.',
    },
  });

  // Warga 9: Nurhayati
  const userNur = await prisma.user.create({
    data: {
      email: 'nurhayati@desa.test',
      password: hashedPassword,
      name: 'Nurhayati',
      phone: '081377889900',
      roleId: roleMasyarakat.id,
      villageId: village.id,
      isActive: true,
      isVerified: true,
    },
  });
  await prisma.citizen.create({
    data: {
      userId: userNur.id,
      nik: '3209215207960009',
      noKk: '3209210101900009',
      fullName: 'Nurhayati',
      birthPlace: 'Cirebon',
      birthDate: new Date('1996-07-22'),
      gender: 'PEREMPUAN',
      phone: '081377889900',
      address: 'Desa Silihasih RT 011 / RW 005, Dusun Kaligandu',
      rt: '011',
      rw: '005',
      dusun: 'Dusun Kaligandu',
      desa: 'Desa Silihasih',
      kecamatan: 'Kecamatan Pabedilan',
      kabupaten: 'Kabupaten Cirebon',
      occupation: 'Guru Honorer',
      monthlyIncome: 1300000,
      familyMembersCount: 3,
      houseCondition: 'Milik Sendiri',
      economicDescription: 'Keluarga warga Desa Silihasih.',
    },
  });

  // Warga 10: Bambang Irawan
  const userBambang = await prisma.user.create({
    data: {
      email: 'bambang.irawan@desa.test',
      password: hashedPassword,
      name: 'Bambang Irawan',
      phone: '081288990022',
      roleId: roleMasyarakat.id,
      villageId: village.id,
      isActive: true,
      isVerified: true,
    },
  });
  await prisma.citizen.create({
    data: {
      userId: userBambang.id,
      nik: '3209211809930010',
      noKk: '3209210101900010',
      fullName: 'Bambang Irawan',
      birthPlace: 'Cirebon',
      birthDate: new Date('1993-09-18'),
      gender: 'LAKI_LAKI',
      phone: '081288990022',
      address: 'Desa Silihasih RT 012 / RW 005, Dusun Kaligandu',
      rt: '012',
      rw: '005',
      dusun: 'Dusun Kaligandu',
      desa: 'Desa Silihasih',
      kecamatan: 'Kecamatan Pabedilan',
      kabupaten: 'Kabupaten Cirebon',
      occupation: 'Peternak',
      monthlyIncome: 1200000,
      familyMembersCount: 4,
      houseCondition: 'Milik Sendiri',
      economicDescription: 'Keluarga warga Desa Silihasih.',
    },
  });

  console.log('--- Seeding Realistic Applications Across Workflow Stages ---');

  // APP 1: STAFF_REVIEW (Milik Ahmad Dahlan - Pengajuan Baru masuk)
  const app1 = await prisma.application.create({
    data: {
      applicationNumber: 'REQ-202610-0001',
      userId: userMasyarakat.id,
      citizenId: citizenAhmad.id,
      villageId: village.id,
      status: 'STAFF_REVIEW',
      purposeCategory: 'Pendidikan',
      purposeDescription: 'Permohonan beasiswa Kartu Indonesia Pintar Kuliah (KIP-K) untuk anak pertama yang diterima di PTN.',
      aiCompletenessScore: 100,
      aiAnalysisResult: JSON.stringify({
        dataComplete: true,
        documentsPresent: ['KTP', 'KK', 'PENDUKUNG'],
        ocrMatchStatus: 'MATCH',
        ocrConfidence: 96,
        summary: 'Semua berkas dan formulir pemohon lengkap sesuai NIK dan KK. Penghasilan di bawah rata-rata UMR daerah.',
        recommendations: ['Berkas memenuhi syarat administratif verifikasi awal loket.'],
      }),
      submittedAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
    },
  });

  await prisma.applicationDocument.createMany({
    data: [
      {
        applicationId: app1.id,
        documentType: 'KTP',
        fileName: 'ktp_ahmad_dahlan.jpg',
        fileUrl: '/uploads/samples/ktp_sample.jpg',
        fileType: 'image/jpeg',
        fileSize: 450210,
        ocrExtractedText: 'NIK: 3201011504920001 NAMA: AHMAD DAHLAN TEMPAT/TGL LAHIR: BOGOR, 15-04-1992 ALAMAT: KP BABAKAN RT 003 RW 002',
        ocrMatchStatus: 'MATCH',
      },
      {
        applicationId: app1.id,
        documentType: 'KK',
        fileName: 'kk_ahmad_dahlan.pdf',
        fileUrl: '/uploads/samples/kk_sample.pdf',
        fileType: 'application/pdf',
        fileSize: 820140,
        ocrExtractedText: 'NO KK: 3201012908050002 KEPALA KELUARGA: AHMAD DAHLAN ANGGOTA: SITI NUR, FAJAR DAHLAN, RANI DAHLAN',
        ocrMatchStatus: 'MATCH',
      },
      {
        applicationId: app1.id,
        documentType: 'PENDUKUNG',
        fileName: 'surat_pengantar_rt_rw.pdf',
        fileUrl: '/uploads/samples/pengantar_sample.pdf',
        fileType: 'application/pdf',
        fileSize: 310500,
        ocrExtractedText: 'SURAT PENGANTAR RT 003 RW 002 MENERANGKAN BAHWA AHMAD DAHLAN ADALAH BENAR WARGA TIDAK MAMPU SECARA EKONOMI',
        ocrMatchStatus: 'MATCH',
      },
    ],
  });

  await prisma.applicationStatusHistory.createMany({
    data: [
      {
        applicationId: app1.id,
        changedById: userMasyarakat.id,
        previousStatus: 'DRAFT',
        newStatus: 'SUBMITTED',
        actionTitle: 'Pengajuan Dibuat & Dikirim',
        comment: 'Pemohon mengirimkan formulir permohonan SKTM untuk keperluan beasiswa pendidikan KIP-K.',
        createdAt: new Date(Date.now() - 3600000 * 4),
      },
      {
        applicationId: app1.id,
        changedById: userStaff.id,
        previousStatus: 'SUBMITTED',
        newStatus: 'STAFF_REVIEW',
        actionTitle: 'Antrean Pemeriksaan Staf',
        comment: 'Berkas diterima oleh sistem dan masuk ke meja staf pelayanan loket.',
        createdAt: new Date(Date.now() - 3600000 * 3),
      },
    ],
  });

  // APP 2: SUPERADMIN_REVIEW (Milik Dewi Sartika - Sudah dicek staf, sekarang diverifikasi Superadmin)
  const app2 = await prisma.application.create({
    data: {
      applicationNumber: 'REQ-202610-0002',
      userId: userWarga2.id,
      citizenId: citizenDewi.id,
      villageId: village.id,
      status: 'SUPERADMIN_REVIEW',
      purposeCategory: 'Kesehatan',
      purposeDescription: 'Keringanan biaya rawat inap dan obat RSUD Kabupaten Cirebon untuk pengobatan penyakit paru-paru.',
      currentStaffNote: 'Pemeriksaan berkas fisik & digital telah sesuai. Pemohon terdaftar dalam data DTKS P3KE Desa Silihasih.',
      aiCompletenessScore: 100,
      aiAnalysisResult: JSON.stringify({
        dataComplete: true,
        documentsPresent: ['KTP', 'KK'],
        ocrMatchStatus: 'MATCH',
        ocrConfidence: 98,
        summary: 'Dokumen KTP dan KK cocok 100% dengan database kependudukan.',
        recommendations: ['Prioritaskan verifikasi medis darurat.'],
      }),
      submittedAt: new Date(Date.now() - 3600000 * 24),
      reviewedByStaffAt: new Date(Date.now() - 3600000 * 12),
    },
  });

  await prisma.applicationDocument.createMany({
    data: [
      {
        applicationId: app2.id,
        documentType: 'KTP',
        fileName: 'ktp_dewi.jpg',
        fileUrl: '/uploads/samples/ktp_sample.jpg',
        fileType: 'image/jpeg',
        fileSize: 390120,
        ocrExtractedText: 'NIK: 3201014809900005 NAMA: DEWI SARTIKA BOGOR 08-09-1990',
        ocrMatchStatus: 'MATCH',
      },
      {
        applicationId: app2.id,
        documentType: 'KK',
        fileName: 'kk_dewi.pdf',
        fileUrl: '/uploads/samples/kk_sample.pdf',
        fileType: 'application/pdf',
        fileSize: 740110,
        ocrExtractedText: 'NO KK: 3201011204090008 KEPALA KELUARGA: DEWI SARTIKA',
        ocrMatchStatus: 'MATCH',
      },
    ],
  });

  await prisma.applicationReview.create({
    data: {
      applicationId: app2.id,
      reviewerId: userStaff.id,
      reviewerRole: 'STAFF',
      action: 'STAFF_FORWARD_SUPERADMIN',
      notes: 'Berkas valid dan lengkap. Diteruskan ke Superadmin Kasi Pelayanan.',
      createdAt: new Date(Date.now() - 3600000 * 12),
    },
  });

  await prisma.applicationStatusHistory.createMany({
    data: [
      {
        applicationId: app2.id,
        changedById: userWarga2.id,
        previousStatus: 'DRAFT',
        newStatus: 'SUBMITTED',
        actionTitle: 'Pengajuan Dikirim',
        comment: 'Pengajuan SKTM Kesehatan dikirimkan.',
        createdAt: new Date(Date.now() - 3600000 * 24),
      },
      {
        applicationId: app2.id,
        changedById: userStaff.id,
        previousStatus: 'STAFF_REVIEW',
        newStatus: 'SUPERADMIN_REVIEW',
        actionTitle: 'Diteruskan ke Superadmin',
        comment: 'Staf Siti Rahmawati telah memverifikasi berkas dan meneruskan ke Superadmin Kasi Pelayanan.',
        createdAt: new Date(Date.now() - 3600000 * 12),
      },
    ],
  });

  // APP 3: HEAD_REVIEW (Milik Herman Prasetyo - Sudah disetujui Superadmin, Menunggu Kepala Desa)
  const app3 = await prisma.application.create({
    data: {
      applicationNumber: 'REQ-202610-0003',
      userId: userWarga3.id,
      citizenId: citizenHerman.id,
      villageId: village.id,
      status: 'HEAD_REVIEW',
      purposeCategory: 'Bantuan sosial',
      purposeDescription: 'Pengajuan kepesertaan Program Indonesia Pintar (PIP) dan bantuan sembako cadangan pangan pemerintah.',
      currentStaffNote: 'Lengkap dan valid.',
      currentSuperadminNote: 'Telah diverifikasi lapangan oleh ketua RT 04 RW 01. Layak diajukan persetujuan Kepala Desa.',
      aiCompletenessScore: 100,
      aiAnalysisResult: JSON.stringify({
        dataComplete: true,
        documentsPresent: ['KTP', 'KK', 'PENDUKUNG'],
        ocrMatchStatus: 'MATCH',
        ocrConfidence: 95,
        summary: 'Pemeriksaan otomatis AI: kelayakan ekonomi terpenuhi sesuai standar desil 1 DTKS.',
        recommendations: ['Siap ditandatangani Kepala Desa.'],
      }),
      submittedAt: new Date(Date.now() - 3600000 * 48),
      reviewedByStaffAt: new Date(Date.now() - 3600000 * 30),
      reviewedBySuperadminAt: new Date(Date.now() - 3600000 * 8),
    },
  });

  await prisma.applicationReview.createMany({
    data: [
      {
        applicationId: app3.id,
        reviewerId: userStaff.id,
        reviewerRole: 'STAFF',
        action: 'STAFF_FORWARD_SUPERADMIN',
        notes: 'Kelengkapan dokumen terverifikasi.',
        createdAt: new Date(Date.now() - 3600000 * 30),
      },
      {
        applicationId: app3.id,
        reviewerId: userSuperadmin.id,
        reviewerRole: 'SUPERADMIN',
        action: 'SUPERADMIN_APPROVE',
        notes: 'Verifikasi faktual selesai. Direkomendasikan untuk persetujuan Kepala Desa.',
        createdAt: new Date(Date.now() - 3600000 * 8),
      },
    ],
  });

  await prisma.applicationStatusHistory.createMany({
    data: [
      {
        applicationId: app3.id,
        changedById: userWarga3.id,
        previousStatus: 'DRAFT',
        newStatus: 'SUBMITTED',
        actionTitle: 'Pengajuan Dikirim',
        comment: 'Pengajuan SKTM dibuat.',
        createdAt: new Date(Date.now() - 3600000 * 48),
      },
      {
        applicationId: app3.id,
        changedById: userStaff.id,
        previousStatus: 'STAFF_REVIEW',
        newStatus: 'SUPERADMIN_REVIEW',
        actionTitle: 'Diverifikasi Staf',
        comment: 'Diteruskan ke Superadmin.',
        createdAt: new Date(Date.now() - 3600000 * 30),
      },
      {
        applicationId: app3.id,
        changedById: userSuperadmin.id,
        previousStatus: 'SUPERADMIN_REVIEW',
        newStatus: 'HEAD_REVIEW',
        actionTitle: 'Disetujui Superadmin -> Menunggu Kepala Desa',
        comment: 'Superadmin Budi Santoso menyetujui verifikasi. Masuk ke antrean Kepala Desa.',
        createdAt: new Date(Date.now() - 3600000 * 8),
      },
    ],
  });

  // APP 4: COMPLETED (Milik Ahmad Dahlan yang sudah selesai sebelumnya)
  const app4 = await prisma.application.create({
    data: {
      applicationNumber: 'REQ-202610-0004',
      userId: userMasyarakat.id,
      citizenId: citizenAhmad.id,
      villageId: village.id,
      status: 'COMPLETED',
      purposeCategory: 'Kesehatan',
      purposeDescription: 'Pembebasan biaya administrasi dan obat di RSUD Kabupaten Cirebon.',
      currentStaffNote: 'Lengkap dan valid',
      currentSuperadminNote: 'Memenuhi syarat verifikasi Kasi Pelayanan.',
      aiCompletenessScore: 100,
      submittedAt: new Date(Date.now() - 3600000 * 72),
      reviewedByStaffAt: new Date(Date.now() - 3600000 * 50),
      reviewedBySuperadminAt: new Date(Date.now() - 3600000 * 28),
      approvedByHeadAt: new Date(Date.now() - 3600000 * 10),
      completedAt: new Date(Date.now() - 3600000 * 10),
    },
  });

  // Generated document for APP 4
  const docNumber = '470/028/SKTM/X/2026';
  await prisma.generatedDocument.create({
    data: {
      applicationId: app4.id,
      documentNumber: docNumber,
      title: 'SURAT KETERANGAN TIDAK MAMPU',
      qrCodeData: `http://localhost:3000/verify/${encodeURIComponent(docNumber)}`,
      signedByName: 'Drs. H. Mulyadi, M.Si',
      signedByTitle: 'Kepala Desa Silihasih',
      issuedDate: new Date(Date.now() - 3600000 * 10),
      pdfUrl: `/api/applications/${app4.id}/pdf`,
      documentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      isValid: true,
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: app4.id,
      changedById: userKades.id,
      previousStatus: 'HEAD_REVIEW',
      newStatus: 'COMPLETED',
      actionTitle: 'Disetujui Kepala Desa & SKTM Diterbitkan',
      comment: `Kepala Desa telah menyetujui pengajuan. Surat Keterangan Tidak Mampu diterbitkan dengan No: ${docNumber}`,
      createdAt: new Date(Date.now() - 3600000 * 10),
    },
  });

  console.log('--- Seeding 4 Realistic REJECTED Applications ---');
  // APP 5: REJECTED (Kesehatan - Tidak memenuhi kriteria kemiskinan)
  const app5 = await prisma.application.create({
    data: {
      applicationNumber: 'REQ-202610-0005',
      userId: userMasyarakat.id,
      citizenId: citizenAhmad.id,
      villageId: village.id,
      status: 'REJECTED',
      purposeCategory: 'Kesehatan',
      purposeDescription: 'Permohonan bantuan biaya persalinan rumah sakit swasta non-rekanan.',
      currentStaffNote: 'Pemeriksaan: Penghasilan pemohon melebihi batas kriteria desil kemiskinan.',
      currentSuperadminNote: 'Keputusan penolakan: Tidak memenuhi kriteria penerima bantuan SKTM.',
      aiCompletenessScore: 60,
      rejectionReason: 'Penghasilan pemohon melebihi batas kriteria desil kemiskinan dan fasilitas kesehatan bukan RS rujukan BPJS.',
      submittedAt: new Date(Date.now() - 3600000 * 96),
      reviewedByStaffAt: new Date(Date.now() - 3600000 * 70),
      reviewedBySuperadminAt: new Date(Date.now() - 3600000 * 48),
    },
  });

  // APP 6: REJECTED (Pendidikan - Berkas KK tidak sesuai domisili)
  const app6 = await prisma.application.create({
    data: {
      applicationNumber: 'REQ-202610-0006',
      userId: userWarga2.id,
      citizenId: citizenDewi.id,
      villageId: village.id,
      status: 'REJECTED',
      purposeCategory: 'Pendidikan',
      purposeDescription: 'Permohonan beasiswa SPP sekolah swasta anak tingkat SMA.',
      currentStaffNote: 'Pemeriksaan berkas: Data kependudukan belum dipindahkan.',
      currentSuperadminNote: 'Keputusan penolakan: Dokumen Kartu Keluarga tidak beralamat di Desa Silihasih.',
      aiCompletenessScore: 50,
      rejectionReason: 'Berkas Kartu Keluarga tidak beralamat di Desa Silihasih dan data DTKS tidak ditemukan.',
      submittedAt: new Date(Date.now() - 3600000 * 90),
      reviewedByStaffAt: new Date(Date.now() - 3600000 * 65),
      reviewedBySuperadminAt: new Date(Date.now() - 3600000 * 40),
    },
  });

  // APP 7: REJECTED (Bantuan sosial - Verifikasi lapangan tidak layak)
  const app7 = await prisma.application.create({
    data: {
      applicationNumber: 'REQ-202610-0007',
      userId: userWarga3.id,
      citizenId: citizenHerman.id,
      villageId: village.id,
      status: 'REJECTED',
      purposeCategory: 'Bantuan sosial',
      purposeDescription: 'Pengajuan bantuan sembako dan renovasi rumah tidak layak huni (RUTILAHU).',
      currentStaffNote: 'Perlu verifikasi lapangan kondisi riil aset.',
      currentSuperadminNote: 'Hasil verifikasi lapangan: pemohon memiliki kendaraan roda empat dan tanah bersertifikat.',
      aiCompletenessScore: 60,
      rejectionReason: 'Hasil verifikasi lapangan kepala dusun menunjukkan pemohon memiliki aset kendaraan roda empat dan tanah bersertifikat.',
      submittedAt: new Date(Date.now() - 3600000 * 80),
      reviewedByStaffAt: new Date(Date.now() - 3600000 * 55),
      reviewedBySuperadminAt: new Date(Date.now() - 3600000 * 30),
    },
  });

  // APP 8: REJECTED (Listrik / PLN - Melewati batas waktu perbaikan)
  const app8 = await prisma.application.create({
    data: {
      applicationNumber: 'REQ-202610-0008',
      userId: userMasyarakat.id,
      citizenId: citizenAhmad.id,
      villageId: village.id,
      status: 'REJECTED',
      purposeCategory: 'Lainnya',
      purposeDescription: 'Permohonan subsidi listrik daya 900VA ke 450VA.',
      currentStaffNote: 'Dokumen surat pengantar RT/RW kadaluarsa lebih dari 3 bulan.',
      currentSuperadminNote: 'Ditolak sistem: Batas waktu perbaikan 14 hari telah terlampaui.',
      aiCompletenessScore: 40,
      rejectionReason: 'Batas waktu perbaikan berkas surat pengantar RT/RW telah melewati 14 hari kerja tanpa konfirmasi pemohon.',
      submittedAt: new Date(Date.now() - 3600000 * 70),
      reviewedByStaffAt: new Date(Date.now() - 3600000 * 45),
      reviewedBySuperadminAt: new Date(Date.now() - 3600000 * 20),
    },
  });

  await prisma.applicationStatusHistory.createMany({
    data: [
      {
        applicationId: app5.id,
        changedById: userSuperadmin.id,
        previousStatus: 'SUPERADMIN_REVIEW',
        newStatus: 'REJECTED',
        actionTitle: 'Pengajuan Ditolak (Tidak Memenuhi Syarat)',
        comment: 'Penghasilan pemohon melebihi batas kriteria desil kemiskinan dan fasilitas kesehatan bukan RS rujukan BPJS.',
        createdAt: new Date(Date.now() - 3600000 * 48),
      },
      {
        applicationId: app6.id,
        changedById: userSuperadmin.id,
        previousStatus: 'SUPERADMIN_REVIEW',
        newStatus: 'REJECTED',
        actionTitle: 'Pengajuan Ditolak (Tidak Memenuhi Syarat)',
        comment: 'Berkas Kartu Keluarga tidak beralamat di Desa Silihasih dan data DTKS tidak ditemukan.',
        createdAt: new Date(Date.now() - 3600000 * 40),
      },
      {
        applicationId: app7.id,
        changedById: userSuperadmin.id,
        previousStatus: 'SUPERADMIN_REVIEW',
        newStatus: 'REJECTED',
        actionTitle: 'Pengajuan Ditolak (Tidak Memenuhi Syarat)',
        comment: 'Hasil verifikasi lapangan kepala dusun menunjukkan pemohon memiliki aset kendaraan roda empat dan tanah bersertifikat.',
        createdAt: new Date(Date.now() - 3600000 * 30),
      },
      {
        applicationId: app8.id,
        changedById: userStaff.id,
        previousStatus: 'NEED_REVISION',
        newStatus: 'REJECTED',
        actionTitle: 'Pengajuan Ditolak (Batas Waktu Habis)',
        comment: 'Batas waktu perbaikan berkas surat pengantar RT/RW telah melewati 14 hari kerja tanpa konfirmasi pemohon.',
        createdAt: new Date(Date.now() - 3600000 * 20),
      },
    ],
  });

  console.log('--- Seeding 6 Realistic NEED_REVISION Applications ---');
  const revisionNotesList = [
    { num: 'REQ-202610-0010', cat: 'Pendidikan', desc: 'Permohonan rekomendasi beasiswa kuliah anak.', note: 'Foto KTP buram dan tidak terbaca jelas pada NIK. Harap unggah ulang foto e-KTP asli yang jelas.' },
    { num: 'REQ-202610-0011', cat: 'Kesehatan', desc: 'Permohonan SKTM keringanan biaya rawat jalan puskesmas.', note: 'Surat pengantar RT/RW belum ditandatangani oleh Ketua RT setempat. Mohon dilengkapi tanda tangan dan stempel RT.' },
    { num: 'REQ-202610-0012', cat: 'Bantuan sosial', desc: 'Pendaftaran kepesertaan bansos pangan cadangan beras.', note: 'Dokumen Kartu Keluarga masih versi lama tanpa barcode TTE. Mohon lampirkan KK terbaru dari Disdukcapil.' },
    { num: 'REQ-202610-0013', cat: 'Administrasi', desc: 'Permohonan surat keterangan penghasilan tidak tetap.', note: 'Surat pernyataan penghasilan belum ditandatangani di atas meterai Rp 10.000. Harap perbaiki formulir pernyataan.' },
    { num: 'REQ-202610-0014', cat: 'Kesehatan', desc: 'Permohonan bantuan keringanan obat terapi kronis.', note: 'Foto rumah tampak depan belum disertakan sebagai berkas pendukung kelayakan ekonomi. Harap unggah foto rumah.' },
    { num: 'REQ-202610-0015', cat: 'Pendidikan', desc: 'Permohonan beasiswa SPP anak tingkat SMP.', note: 'Formulir permohonan SKTM dari desa belum ditandatangani pemohon. Mohon ditandatangani terlebih dahulu.' },
  ];

  const citizenList = [citizenAhmad, citizenDewi, citizenHerman, citizenAhmad, citizenDewi, citizenHerman];
  const userList = [userMasyarakat, userWarga2, userWarga3, userMasyarakat, userWarga2, userWarga3];

  for (let i = 0; i < revisionNotesList.length; i++) {
    const r = revisionNotesList[i];
    const appRev = await prisma.application.create({
      data: {
        applicationNumber: r.num,
        userId: userList[i].id,
        citizenId: citizenList[i].id,
        villageId: village.id,
        status: 'NEED_REVISION',
        purposeCategory: r.cat,
        purposeDescription: r.desc,
        currentStaffNote: r.note,
        revisionNotes: r.note,
        aiCompletenessScore: 70,
        submittedAt: new Date(Date.now() - 3600000 * 24 * (i + 1)),
        reviewedByStaffAt: new Date(Date.now() - 3600000 * (i + 1) * 2),
      },
    });

    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: appRev.id,
        changedById: userStaff.id,
        previousStatus: 'STAFF_REVIEW',
        newStatus: 'NEED_REVISION',
        actionTitle: 'Berkas Dikembalikan (Perlu Perbaikan)',
        comment: r.note,
        createdAt: new Date(Date.now() - 3600000 * (i + 1) * 2),
      },
    });
  }

  console.log('--- Seeding Notifications ---');
  await prisma.notification.createMany({
    data: [
      {
        userId: userMasyarakat.id,
        title: 'SKTM Telah Diterbitkan!',
        message: 'Pengajuan SKTM No. REQ-202610-0004 telah disetujui Kepala Desa dan dokumen resmi dapat diunduh.',
        type: 'SUCCESS',
        isRead: false,
        linkUrl: `/dashboard/masyarakat/applications/${app4.id}`,
      },
      {
        userId: userMasyarakat.id,
        title: 'Pengajuan Sedang Diperiksa',
        message: 'Pengajuan SKTM No. REQ-202610-0001 saat ini sedang dalam antrean pemeriksaan oleh Staf Desa.',
        type: 'INFO',
        isRead: true,
        linkUrl: `/dashboard/masyarakat/applications/${app1.id}`,
      },
      {
        userId: userKades.id,
        title: '1 Pengajuan Menunggu Persetujuan Anda',
        message: 'Pengajuan atas nama Herman Prasetyo telah diverifikasi Superadmin dan menunggu tanda tangan Anda.',
        type: 'WARNING',
        isRead: false,
        linkUrl: `/dashboard/kades`,
      },
    ],
  });

  console.log('--- Seeding Audit Logs ---');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: userKades.id,
        userEmail: 'h.mulyadi@gmail.go.id',
        userRole: 'KEPALA_DESA',
        action: 'HEAD_APPROVE',
        entity: 'Application',
        entityId: app4.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        details: JSON.stringify({ documentNumber: docNumber, status: 'COMPLETED' }),
      },
      {
        userId: userMasyarakat.id,
        userEmail: 'masyarakat@gmail.go.id',
        userRole: 'MASYARAKAT',
        action: 'CREATE_APPLICATION',
        entity: 'Application',
        entityId: app1.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        details: JSON.stringify({ purpose: 'Pendidikan', number: 'REQ-202610-0001' }),
      },
    ],
  });

  console.log('--- Seeding AI Configuration ---');
  const aiApiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
  if (aiApiKey) {
    const aiProviderName = 'GroqCloud';
    const aiBaseUrl = 'https://api.groq.com/openai/v1';
    const aiModel = 'openai/gpt-oss-120b';

    const defaultAiCred = await prisma.aiCredential.upsert({
      where: {
        providerName_model: {
          providerName: aiProviderName,
          model: aiModel,
        },
      },
      create: {
        providerName: aiProviderName,
        baseUrl: aiBaseUrl,
        model: aiModel,
        apiKey: aiApiKey,
      },
      update: {
        baseUrl: aiBaseUrl,
        apiKey: aiApiKey,
      },
    });

    await prisma.aiSetting.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        providerName: aiProviderName,
        baseUrl: aiBaseUrl,
        model: aiModel,
        apiKey: aiApiKey,
        activeCredentialId: defaultAiCred.id,
        updatedByName: 'Superadmin Desa',
      },
      update: {
        providerName: aiProviderName,
        baseUrl: aiBaseUrl,
        model: aiModel,
        apiKey: aiApiKey,
        activeCredentialId: defaultAiCred.id,
        updatedByName: 'Superadmin Desa',
      },
    });
  }

  console.log('=== Database seeded successfully! ===');
  console.log('Demo Accounts:');
  console.log('1. Kepala Desa: h.mulyadi@gmail.go.id / Password123!');
  console.log('2. Superadmin:  budi.santoso@gmail.go.id / Password123!');
  console.log('3. Staf Desa:   siti.rahmawati@gmail.go.id / Password123!');
  console.log('4. Masyarakat:  masyarakat@desa.test / Password123!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
