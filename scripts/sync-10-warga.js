const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Syncing 10 Warga including ikin11886@gmail.com ---');

  const roleMasyarakat = await prisma.role.findUnique({
    where: { name: 'MASYARAKAT' },
  });
  if (!roleMasyarakat) throw new Error('Role MASYARAKAT not found');

  const village = await prisma.village.findFirst();
  if (!village) throw new Error('Village not found');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Daftar 10 Warga Resmi Desa Silihasih
  const wargaList = [
    {
      name: 'Ahmad Dahlan',
      email: 'masyarakat@desa.test',
      phone: '081234567890',
      nik: '3209210101900001',
      noKk: '3209210101900001',
      rt: '001',
      rw: '001',
      dusun: 'Dusun Wage',
      occupation: 'Buruh Harian Lepas',
    },
    {
      name: 'Dewi Sartika',
      email: 'warga2@desa.test',
      phone: '081311223344',
      nik: '3209214205920002',
      noKk: '3209210101900002',
      rt: '001',
      rw: '001',
      dusun: 'Dusun Wage',
      occupation: 'Pedagang Keliling',
    },
    {
      name: 'Herman Prasetyo',
      email: 'warga3@desa.test',
      phone: '081255667788',
      nik: '3209211508880003',
      noKk: '3209210101900003',
      rt: '004',
      rw: '002',
      dusun: 'Dusun Wage',
      occupation: 'Petani Penggarap',
    },
    {
      name: 'James',
      email: 'edunasihin@gmail.com',
      phone: '081298765432',
      nik: '3209211204950004',
      noKk: '3209210101900004',
      rt: '002',
      rw: '001',
      dusun: 'Dusun Wage',
      occupation: 'Wiraswasta',
    },
    {
      name: 'Wildan Prastio',
      email: 'prastiowildan15@gmail.com',
      phone: '081388990011',
      nik: '3209212006930005',
      noKk: '3209210101900005',
      rt: '005',
      rw: '002',
      dusun: 'Dusun Wage',
      occupation: 'Karyawan Swasta',
    },
    {
      name: 'Ikin Nasihin',
      email: 'ikin11886@gmail.com',
      phone: '081223344556',
      nik: '3209210808980006',
      noKk: '3209210101900006',
      rt: '003',
      rw: '001',
      dusun: 'Dusun Wage',
      occupation: 'Wiraswasta',
    },
    {
      name: 'Siti Aminah',
      email: 'siti.aminah@desa.test',
      phone: '081344556677',
      nik: '3209214502940007',
      noKk: '3209210101900007',
      rt: '007',
      rw: '003',
      dusun: 'Dusun Kliwon',
      occupation: 'Ibu Rumah Tangga',
    },
    {
      name: 'Rahmat Hidayat',
      email: 'rahmat.hidayat@desa.test',
      phone: '081266778899',
      nik: '3209211003910008',
      noKk: '3209210101900008',
      rt: '008',
      rw: '003',
      dusun: 'Dusun Kliwon',
      occupation: 'Pedagang',
    },
    {
      name: 'Nurhayati',
      email: 'nurhayati@desa.test',
      phone: '081377889900',
      nik: '3209215207960009',
      noKk: '3209210101900009',
      rt: '011',
      rw: '005',
      dusun: 'Dusun Kaligandu',
      occupation: 'Guru Honorer',
    },
    {
      name: 'Bambang Irawan',
      email: 'bambang.irawan@desa.test',
      phone: '081288990022',
      nik: '3209211809930010',
      noKk: '3209210101900010',
      rt: '012',
      rw: '005',
      dusun: 'Dusun Kaligandu',
      occupation: 'Peternak',
    },
  ];

  for (const w of wargaList) {
    let user = await prisma.user.findUnique({
      where: { email: w.email.toLowerCase().trim() },
      include: { citizen: true },
    });

    if (!user) {
      console.log(`Creating user: ${w.name} (${w.email})...`);
      user = await prisma.user.create({
        data: {
          email: w.email.toLowerCase().trim(),
          password: hashedPassword,
          name: w.name,
          phone: w.phone,
          roleId: roleMasyarakat.id,
          villageId: village.id,
          isActive: true,
          isVerified: true,
          citizen: {
            create: {
              nik: w.nik,
              noKk: w.noKk,
              fullName: w.name,
              birthPlace: 'Cirebon',
              birthDate: new Date('1995-05-15'),
              gender: w.name.includes('Siti') || w.name.includes('Dewi') || w.name.includes('Nurhayati') ? 'PEREMPUAN' : 'LAKI_LAKI',
              phone: w.phone,
              address: `Desa Silihasih RT ${w.rt} / RW ${w.rw}, ${w.dusun}`,
              rt: w.rt,
              rw: w.rw,
              dusun: w.dusun,
              desa: village.name,
              kecamatan: village.district,
              kabupaten: village.regency,
              occupation: w.occupation,
              monthlyIncome: 1200000,
              familyMembersCount: 4,
              houseCondition: 'Milik Sendiri',
              economicDescription: 'Keluarga warga Desa Silihasih.',
            },
          },
        },
        include: { citizen: true },
      });
    } else {
      console.log(`User already exists: ${w.name} (${w.email}), ensuring verified & active...`);
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: true, isVerified: true },
      });
      if (!user.citizen) {
        console.log(`Creating citizen profile for: ${w.name}...`);
        await prisma.citizen.create({
          data: {
            userId: user.id,
            nik: w.nik,
            noKk: w.noKk,
            fullName: w.name,
            birthPlace: 'Cirebon',
            birthDate: new Date('1995-05-15'),
            gender: w.name.includes('Siti') || w.name.includes('Dewi') || w.name.includes('Nurhayati') ? 'PEREMPUAN' : 'LAKI_LAKI',
            phone: w.phone,
            address: `Desa Silihasih RT ${w.rt} / RW ${w.rw}, ${w.dusun}`,
            rt: w.rt,
            rw: w.rw,
            dusun: w.dusun,
            desa: village.name,
            kecamatan: village.district,
            kabupaten: village.regency,
            occupation: w.occupation,
            monthlyIncome: 1200000,
            familyMembersCount: 4,
            houseCondition: 'Milik Sendiri',
            economicDescription: 'Keluarga warga Desa Silihasih.',
          },
        });
      }
    }
  }

  const allUsers = await prisma.user.findMany({ select: { name: true, email: true, role: { select: { name: true } } } });
  const allCitizens = await prisma.citizen.findMany({ select: { fullName: true, nik: true, user: { select: { email: true } } } });

  console.log(`Total Users in DB: ${allUsers.length}`);
  console.log(`Total Citizens (Warga) in DB: ${allCitizens.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
