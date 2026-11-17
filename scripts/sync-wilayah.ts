// Menyelaraskan tabel rukun_warga & rukun_tetangga dengan peta resmi RW/RT desa
// (src/lib/desa-config.ts -> DESA_RW_RT). Idempotent, aman dijalankan berulang
// tanpa menghapus data pengguna: npm run db:sync-wilayah
import { prisma } from '@/lib/prisma';
import { syncDesaWilayah } from '@/lib/wilayah';

async function main() {
  const villages = await prisma.village.findMany({ select: { id: true, name: true } });
  if (!villages.length) {
    console.error('Tidak ada desa di database. Jalankan `npm run db:seed` terlebih dahulu.');
    process.exit(1);
  }

  for (const village of villages) {
    const totalRt = await syncDesaWilayah(village.id);
    console.log(`${village.name}: ${totalRt.rw} RW, ${totalRt.rt} RT tersinkron.`);
  }

  const rows = await prisma.rukunWarga.findMany({
    include: { rukunTetangga: { orderBy: { code: 'asc' } } },
    orderBy: { code: 'asc' },
  });
  rows.forEach((rw) => {
    console.log(
      `  RW ${rw.code} (${rw.dusun}) -> ${rw.rukunTetangga.map((rt) => `RT ${rt.code}`).join(', ')}`
    );
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Sinkronisasi wilayah gagal:', error);
  process.exit(1);
});
