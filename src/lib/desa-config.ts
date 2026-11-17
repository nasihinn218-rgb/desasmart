// Satu sumber kebenaran identitas wilayah DesaSmart.
// Ubah di sini bila data desa berubah, lalu sinkronkan UI & DB terkait.

export interface DusunWilayah {
  nama: string;
  jumlahRW: number;
  jumlahRT: number;
}

/** Satu RW resmi beserta daftar kode RT di bawahnya. */
export interface RukunWargaWilayah {
  rw: string; // kode RW 3 digit, contoh "001"
  dusun: string; // nama dusun, contoh "Dusun Wage"
  rt: string[]; // kode RT 3 digit milik RW ini
}

// Peta resmi RW 001-005 dan RT 001-012 Desa Silihasih.
// Sumber kebenaran tunggal: jumlah dusun/RW/RT, profil AI, dan seed tabel
// rukun_warga / rukun_tetangga diturunkan dari daftar ini.
export const DESA_RW_RT: RukunWargaWilayah[] = [
  { rw: '001', dusun: 'Dusun Wage', rt: ['001', '002', '003'] },
  { rw: '002', dusun: 'Dusun Wage', rt: ['004', '005', '006'] },
  { rw: '003', dusun: 'Dusun Kliwon', rt: ['007', '008'] },
  { rw: '004', dusun: 'Dusun Kliwon', rt: ['009', '010'] },
  { rw: '005', dusun: 'Dusun Kaligandu', rt: ['011', '012'] },
];

const DUSUN_RESMI: string[] = DESA_RW_RT.reduce<string[]>((names, row) => {
  if (!names.includes(row.dusun)) names.push(row.dusun);
  return names;
}, []);

// Daftar dusun resmi Desa Silihasih (sumber kebenaran wilayah administrasi).
export const DESA_DUSUN: DusunWilayah[] = DUSUN_RESMI.map((nama) => {
  const rows = DESA_RW_RT.filter((row) => row.dusun === nama);
  return {
    nama,
    jumlahRW: rows.length,
    jumlahRT: rows.reduce((total, row) => total + row.rt.length, 0),
  };
});

/** Kode RW resmi, berurutan: ["001", ..., "005"]. */
export const DAFTAR_KODE_RW: string[] = DESA_RW_RT.map((row) => row.rw);

/** Kode RT resmi beserta RW & dusun induknya. */
export const DAFTAR_RT: Array<{ rt: string; rw: string; dusun: string }> =
  DESA_RW_RT.flatMap((row) =>
    row.rt.map((rt) => ({ rt, rw: row.rw, dusun: row.dusun }))
  );

/** Semua kode RT resmi, berurutan: ["001", ..., "012"]. */
export const DAFTAR_KODE_RT: string[] = DAFTAR_RT.map((row) => row.rt);

/** Normalisasi "RW 2", "02", "rt-10" menjadi kode 3 digit "002" / "010". */
export function normalizeRegionCode(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (!digits || digits.length > 3) return null;
  const padded = digits.padStart(3, '0');
  return padded;
}

/** Cari RW resmi dari kode apa pun ("2", "002", "RW 002"); null kalau tak dikenal. */
export function findRwWilayah(value: string): RukunWargaWilayah | null {
  const code = normalizeRegionCode(value);
  if (!code) return null;
  return DESA_RW_RT.find((row) => row.rw === code) ?? null;
}

/** Cari RT resmi beserta RW & dusun induknya; null kalau tak dikenal. */
export function findRtWilayah(value: string) {
  const code = normalizeRegionCode(value);
  if (!code) return null;
  return DAFTAR_RT.find((row) => row.rt === code) ?? null;
}

const withRwPrefix = (code: string) => `RW ${code}`;
const withRtPrefix = (code: string) => `RT ${code}`;

/** "RW 001, RW 002, ..., RW 005" */
export function daftarRWLabel(codes: string[] = DAFTAR_KODE_RW): string {
  return codes.map(withRwPrefix).join(', ');
}

/** "RT 001, RT 002, ..., RT 012" */
export function daftarRTLabel(codes: string[] = DAFTAR_KODE_RT): string {
  return codes.map(withRtPrefix).join(', ');
}

/** "RW 001 (Dusun Wage): RT 001, RT 002, RT 003; RW 002 (...)" */
export function petaRwRtLabel(rows: RukunWargaWilayah[] = DESA_RW_RT): string {
  return rows
    .map((row) => `${withRwPrefix(row.rw)} (${row.dusun}): ${row.rt.map(withRtPrefix).join(', ')}`)
    .join('; ');
}

export const DESA = {
  nama: 'Desa Silihasih',
  kecamatan: 'Kecamatan Pabedilan',
  kabupaten: 'Kabupaten Cirebon',
  provinsi: 'Jawa Barat',
  negara: 'Indonesia',
  kodePos: '45193',
  alamat: 'Jl. Mayjen Sutoyo',
  // Wilayah administrasi — total diturunkan otomatis dari peta RW/RT resmi.
  dusun: DESA_DUSUN,
  jumlahDusun: DESA_DUSUN.length,
  jumlahRW: DAFTAR_KODE_RW.length,
  jumlahRT: DAFTAR_KODE_RT.length,
  daftarRW: DAFTAR_KODE_RW,
  daftarRT: DAFTAR_KODE_RT,
  petaRWRT: DESA_RW_RT,
  // Kontak & pejabat (nilai lama dipertahankan, domain disesuaikan).
  telepon: '(0231) 876-5432',
  email: 'pelayanan@silihasih.desa.id',
  website: 'https://silihasih.desa.id',
  kepalaDesaName: 'Drs. H. Mulyadi, M.Si',
};

export const DESA_ALAMAT_LENGKAP = `${DESA.alamat}, ${DESA.kecamatan}, ${DESA.kabupaten}, ${DESA.provinsi}, ${DESA.negara} ${DESA.kodePos}`;

/** Ringkasan profil untuk disuntikkan ke sistem prompt AI. */
export const DESA_PROFILE_BRIEF =
  `PROFIL WILAYAH RESMI (fakta asli, WAJIB dipakai untuk menjawab pertanyaan tentang desa ini):\n` +
  `- Nama Desa: ${DESA.nama}\n` +
  `- Kecamatan: ${DESA.kecamatan}\n` +
  `- Kabupaten: ${DESA.kabupaten}\n` +
  `- Provinsi: ${DESA.provinsi}\n` +
  `- Negara: ${DESA.negara}\n` +
  `- Kode Pos: ${DESA.kodePos}\n` +
  `- Alamat Kantor Desa: ${DESA.alamat}\n` +
  `- Jumlah Dusun: ${DESA.jumlahDusun} dusun (${DESA.dusun.map((d) => d.nama.replace(/^Dusun\s+/i, '')).join(', ')})\n` +
  `- Jumlah RW: ${DESA.jumlahRW} RW\n` +
  `- Jumlah RT: ${DESA.jumlahRT} RT\n` +
  `- Daftar RW resmi: ${daftarRWLabel()}\n` +
  `- Daftar RT resmi: ${daftarRTLabel()}\n` +
  `- Peta RW ke RT (hanya ini yang benar): ${petaRwRtLabel(DESA_RW_RT)}\n` +
  `- Rincian tiap dusun: ${DESA.dusun.map((d) => `${d.nama} (${d.jumlahRW} RW, ${d.jumlahRT} RT)`).join('; ')}\n` +
  `- Telepon Kantor: ${DESA.telepon} | Email: ${DESA.email}\n` +
  `- Kepala Desa: ${DESA.kepalaDesaName}\n` +
  `DILARANG menyebut nama desa/kecamatan/kabupaten lain (misalnya Sukamaju atau Bogor). ` +
  `DILARANG mengarang jumlah dusun/RW/RT di atas, dan DILARANG menyebut nomor RW/RT di luar daftar resmi ` +
  `(tidak ada RW 006 ke atas dan tidak ada RT 013 ke atas di desa ini).`;


/**
 * Penjawab deterministik untuk pertanyaan profil wilayah desa.
 * Dipanggil sebelum handler database agar "jumlah dusun/RW/RT", kode pos,
 * kecamatan, kabupaten, provinsi, negara, dan alamat selalu dijawab tepat.
 */
export function answerVillageProfileQuestion(
  question: string
): { reply: string; source: string } | null {
  const q = question.toLowerCase();

  // Pertanyaan nama pejabat / ketua (RT/RW/Kadus/kades/kuwu) ditangani oleh answerPejabatWilayahQuestion di ai-database-context.
  const asksPersonName = /\b(?:siapa|nama|ketua|pejabat|kadus|kades|kuwu)\b/i.test(q);
  if (asksPersonName) {
    return null;
  }

  const src = 'Profil Resmi Desa';
  const has = (...terms: string[]) => terms.some((term) => q.includes(term));
  const asksCount = /\b(?:apa|berapa|jumlah|banyak|ada|sebutkan)\b/i.test(q);

  const dusunList = DESA.dusun.map((d) => d.nama).join(', ');
  const dusunRincian = DESA.dusun
    .map((d) => `${d.nama} (${d.jumlahRW} RW, ${d.jumlahRT} RT)`)
    .join('; ');

  const asksRt = /\brt\b/i.test(q);
  const asksRw = /\brw\b/i.test(q);
  const asksList = has('apa saja', 'sebutkan', 'daftar', 'list', 'mana saja');
  const rwMentions = [...q.matchAll(/\brw\s*-?\s*(\d{1,3})\b/g)].map((m) => m[1]);
  const rtMentions = [...q.matchAll(/\brt\s*-?\s*(\d{1,3})\b/g)].map((m) => m[1]);
  // Pertanyaan jumlah penghuni dijawab dari data warga (ai-database-context), bukan peta wilayah.
  const asksWargaCount =
    /\b(?:warga|penduduk|keluarga|kk)\b/i.test(q) &&
    /\b(?:berapa|jumlah|total|ada)\b/i.test(q);
  const rtHit = rtMentions.map(findRtWilayah).find((row): row is NonNullable<ReturnType<typeof findRtWilayah>> => Boolean(row));
  const rwHit = rwMentions.map(findRwWilayah).find((row): row is RukunWargaWilayah => Boolean(row));

  // "Berapa warga di RT/RW tertentu" bukan ranah profil wilayah — serahkan
  // ke penjawab database (answerWilayahPopulationQuestion) agar angkanya nyata.
  if (asksWargaCount && (rwMentions.length > 0 || rtMentions.length > 0)) return null;

  // Nomor RT resmi spesifik — sebutkan RW dan dusun induknya.
  if (rtHit && !asksWargaCount) {
    if (has('dusun', 'dimana', 'di mana', 'lokasi', 'termasuk', 'masuk')) {
      return {
        reply: `RT ${rtHit.rt} termasuk ${rtHit.dusun}, ${withRwPrefix(rtHit.rw)}.`,
        source: src,
      };
    }
    return {
      reply: `RT ${rtHit.rt} termasuk ${withRwPrefix(rtHit.rw)} di ${rtHit.dusun}.`,
      source: src,
    };
  }

  // Nomor RW resmi spesifik — sebutkan dusun dan daftar RT di bawahnya.
  if (rwHit && !asksWargaCount) {
    const rtLabels = rwHit.rt.map(withRtPrefix).join(', ');
    if (has('dusun', 'dimana', 'di mana', 'lokasi')) {
      return {
        reply: `${withRwPrefix(rwHit.rw)} berada di ${rwHit.dusun} dengan ${rwHit.rt.length} RT (${rtLabels}).`,
        source: src,
      };
    }
    return {
      reply: `${withRwPrefix(rwHit.rw)} (${rwHit.dusun}) memiliki ${rwHit.rt.length} RT, yaitu ${rtLabels}.`,
      source: src,
    };
  }

  // Nomor di luar daftar resmi — koreksi dengan data sebenarnya.
  const unknownCodes = [...rwMentions, ...rtMentions].map(normalizeRegionCode).filter((code): code is string => Boolean(code));
  if (unknownCodes.length && !rtHit && !rwHit && (asksRt || asksRw)) {
    const label = unknownCodes
      .map((code) => (asksRt && !asksRw ? withRtPrefix(code) : asksRw && !asksRt ? withRwPrefix(code) : `RW/RT ${code}`))
      .join(' dan ');
    return {
      reply:
        `${label} tidak terdaftar di ${DESA.nama}. Daftar resmi: ${daftarRWLabel()} ` +
        `(${DESA.jumlahRW} RW) dan ${daftarRTLabel()} (${DESA.jumlahRT} RT).`,
      source: src,
    };
  }

  // Daftar lengkap RW / RT tingkat desa.
  if (asksList && asksRt && asksRw) {
    return {
      reply:
        `${DESA.nama} punya ${DESA.jumlahRW} RW dan ${DESA.jumlahRT} RT. Peta resminya: ${petaRwRtLabel()}.`,
      source: src,
    };
  }
  if (asksList && asksRw) {
    return {
      reply: `Daftar RW di ${DESA.nama} ada ${DESA.jumlahRW}, yaitu ${daftarRWLabel()}.`,
      source: src,
    };
  }
  if (asksList && asksRt) {
    return {
      reply: `Daftar RT di ${DESA.nama} ada ${DESA.jumlahRT}, yaitu ${daftarRTLabel()}.`,
      source: src,
    };
  }

  // Dusun spesifik (Wage / Kliwon / Kaligandu) — cek lebih dulu sebelum hitungan umum.
  const dusunHit = DESA.dusun.find((d) => {
    const short = d.nama.replace(/^dusun\s+/i, '').toLowerCase();
    return q.includes(short);
  });
  if (dusunHit) {
    const asksRtHere = /\brt\b/i.test(q);
    const asksRwHere = /\brw\b/i.test(q);
    if (asksRtHere && asksRwHere) {
      return {
        reply: `${dusunHit.nama} terdiri dari ${dusunHit.jumlahRW} RW dan ${dusunHit.jumlahRT} RT.`,
        source: src,
      };
    }
    if (asksRtHere) {
      return { reply: `${dusunHit.nama} memiliki ${dusunHit.jumlahRT} RT.`, source: src };
    }
    if (asksRwHere) {
      return { reply: `${dusunHit.nama} memiliki ${dusunHit.jumlahRW} RW.`, source: src };
    }
    return {
      reply: `${dusunHit.nama} terdiri dari ${dusunHit.jumlahRW} RW dan ${dusunHit.jumlahRT} RT.`,
      source: src,
    };
  }

  // Jumlah / daftar dusun (tingkat desa).
  if (/\bdusun\b/i.test(q) && asksCount) {
    if (has('nama dusun', 'apa saja', 'sebutkan', 'daftar', 'apa nama', 'dusun apa')) {
      return {
        reply: `${DESA.nama} memiliki ${DESA.jumlahDusun} dusun, yaitu ${dusunList}.`,
        source: src,
      };
    }
    return {
      reply: `${DESA.nama} memiliki ${DESA.jumlahDusun} dusun, yaitu ${dusunList}.`,
      source: src,
    };
  }

  if (asksRt && asksRw && asksCount) {
    return {
      reply:
        `Total ${DESA.nama} ada ${DESA.jumlahRW} RW dan ${DESA.jumlahRT} RT, ` +
        `rincian per dusun: ${dusunRincian}.`,
      source: src,
    };
  }
  if (asksRw && asksCount) {
    return { reply: `Jumlah RW di ${DESA.nama} ada ${DESA.jumlahRW} RW.`, source: src };
  }
  if (asksRt && asksCount) {
    return { reply: `Jumlah RT di ${DESA.nama} ada ${DESA.jumlahRT} RT.`, source: src };
  }

  if (has('kode pos', 'kodepos', 'zip code') && asksCount) {
    return { reply: `Kode pos ${DESA.nama} adalah ${DESA.kodePos}.`, source: src };
  }
  if (has('kecamatan') && asksCount) {
    return { reply: `${DESA.nama} berada di ${DESA.kecamatan}.`, source: src };
  }
  if (has('kabupaten') && asksCount) {
    return { reply: `${DESA.nama} termasuk wilayah ${DESA.kabupaten}.`, source: src };
  }
  if (has('provinsi') && asksCount) {
    return { reply: `${DESA.nama} berada di ${DESA.provinsi}.`, source: src };
  }
  if (has('negara') && asksCount) {
    return { reply: `${DESA.nama} terletak di ${DESA.negara}.`, source: src };
  }
  if (
    has('alamat', 'kantor desa', 'di mana', 'dimana', 'lokasi') &&
    (has('alamat', 'kantor', 'di mana', 'dimana', 'lokasi') || has('desa'))
  ) {
    return {
      reply: `Alamat Kantor ${DESA.nama}: ${DESA_ALAMAT_LENGKAP}.`,
      source: src,
    };
  }

  // Ringkasan umum profil desa.
  if (
    has(
      'nama desa',
      'desa apa',
      'desa ini',
      'desa kamu',
      'profil desa',
      'tentang desa',
      'info desa',
      'informasi desa',
      'data desa',
      'silihasih'
    )
  ) {
    return {
      reply:
        `${DESA.nama} berada di ${DESA.kecamatan}, ${DESA.kabupaten}, ${DESA.provinsi}, ` +
        `Negara ${DESA.negara}, Kode Pos ${DESA.kodePos}, dengan ${DESA.jumlahDusun} dusun ` +
        `(${dusunList}), ${DESA.jumlahRW} RW, dan ${DESA.jumlahRT} RT.`,
      source: src,
    };
  }

  return null;
}
