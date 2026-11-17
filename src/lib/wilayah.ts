import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { DESA_RW_RT, type RukunWargaWilayah } from '@/lib/desa-config';

export interface WilayahRwRow {
  code: string;
  dusun: string;
  rtCodes: string[];
}

export interface WilayahSummary {
  totalRw: number;
  totalRt: number;
  rows: WilayahRwRow[];
  /** Jumlah profil warga terdaftar per kode RT (dari tabel citizens). */
  wargaByRt: Record<string, number>;
  /** Jumlah profil warga terdaftar per kode RW (dari tabel citizens). */
  wargaByRw: Record<string, number>;
  synced: boolean; // true bila tabel sudah berisi data, false bila fallback ke konfigurasi
}

/**
 * Menyelaraskan tabel `rukun_warga` & `rukun_tetangga` dengan peta resmi desa
 * (DESA_RW_RT). Idempotent: bisa dipanggil berulang tanpa duplikasi, dan
 * membersihkan RW/RT yang tidak lagi ada di daftar resmi.
 */
export async function syncDesaWilayah(
  villageId: string,
  client: PrismaClient = prisma
): Promise<{ rw: number; rt: number }> {
  let rwCount = 0;
  let rtCount = 0;

  for (const row of DESA_RW_RT) {
    const rw = await client.rukunWarga.upsert({
      where: { villageId_code: { villageId, code: row.rw } },
      update: { dusun: row.dusun, name: `RW ${row.rw}` },
      create: { villageId, code: row.rw, dusun: row.dusun, name: `RW ${row.rw}` },
    });
    rwCount += 1;

    for (const rt of row.rt) {
      await client.rukunTetangga.upsert({
        where: { rwId_code: { rwId: rw.id, code: rt } },
        update: { name: `RT ${rt}` },
        create: { rwId: rw.id, code: rt, name: `RT ${rt}` },
      });
      rtCount += 1;
    }

    // RT yang tidak lagi tercantum pada RW ini dihapus.
    await client.rukunTetangga.deleteMany({
      where: { rwId: rw.id, code: { notIn: row.rt } },
    });
  }

  await client.rukunWarga.deleteMany({
    where: { villageId, code: { notIn: DESA_RW_RT.map((row) => row.rw) } },
  });

  return { rw: rwCount, rt: rtCount };
}

async function listFromConfig(): Promise<WilayahRwRow[]> {
  return DESA_RW_RT.map((row: RukunWargaWilayah) => ({
    code: row.rw,
    dusun: row.dusun,
    rtCodes: [...row.rt],
  }));
}

/**
 * Ringkasan wilayah administratif untuk konteks AI. Dibaca dari database agar
 * jawaban selalu memakai data tersimpan; bila tabel masih kosong, memakai
 * konfigurasi resmi sebagai cadangan.
 */
export async function getWilayahSummary(villageId?: string | null): Promise<WilayahSummary> {
  const wargaGrouped = await Promise.all([
    prisma.citizen.groupBy({ by: ['rt'], _count: { id: true } }),
    prisma.citizen.groupBy({ by: ['rw'], _count: { id: true } }),
  ]);
  const wargaByRt: Record<string, number> = {};
  const wargaByRw: Record<string, number> = {};
  wargaGrouped[0].forEach((row) => {
    wargaByRt[row.rt] = (wargaByRt[row.rt] ?? 0) + row._count.id;
  });
  wargaGrouped[1].forEach((row) => {
    wargaByRw[row.rw] = (wargaByRw[row.rw] ?? 0) + row._count.id;
  });

  const rukunWarga = await prisma.rukunWarga.findMany({
    where: villageId ? { villageId } : undefined,
    include: { rukunTetangga: { orderBy: { code: 'asc' } } },
    orderBy: { code: 'asc' },
  });

  if (!rukunWarga.length) {
    const rows = await listFromConfig();
    return {
      totalRw: rows.length,
      totalRt: rows.reduce((total, row) => total + row.rtCodes.length, 0),
      rows,
      wargaByRt,
      wargaByRw,
      synced: false,
    };
  }

  const rows: WilayahRwRow[] = rukunWarga.map((rw) => ({
    code: rw.code,
    dusun: rw.dusun,
    rtCodes: rw.rukunTetangga.map((rt) => rt.code),
  }));

  return {
    totalRw: rows.length,
    totalRt: rows.reduce((total, row) => total + row.rtCodes.length, 0),
    rows,
    wargaByRt,
    wargaByRw,
    synced: true,
  };
}

/** Teks ringkas untuk sistem prompt AI (peta RW -> RT + dusun). */
export function formatWilayahBriefing(summary: WilayahSummary): string {
  const peta = summary.rows
    .map((row) => `RW ${row.code} (${row.dusun}): ${row.rtCodes.map((rt) => `RT ${rt}`).join(', ') || '-'}`)
    .join('; ');
  const warga = summary.rows
    .map((row) => `RW ${row.code}=${summary.wargaByRw[row.code] ?? 0} warga`)
    .join(', ');

  return (
    `DATA RESMI RT/RW DESA (dari tabel rukun_warga & rukun_tetangga${summary.synced ? ' di database' : ' konfigurasi desa'}): ` +
    `${summary.totalRw} RW dan ${summary.totalRt} RT. ` +
    `Daftar RW: ${summary.rows.map((row) => `RW ${row.code}`).join(', ')}. ` +
    `Daftar RT: ${summary.rows.flatMap((row) => row.rtCodes).map((rt) => `RT ${rt}`).join(', ')}. ` +
    `Peta RW ke RT: ${peta}. ` +
    (warga ? `Warga terdaftar per RW: ${warga}.` : '')
  );
}
