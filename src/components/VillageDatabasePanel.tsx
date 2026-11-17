'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Home, Users, Network, UserCheck, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { DESA, DESA_RW_RT } from '@/lib/desa-config';

// ── Data pejabat wilayah (3 kadus, 5 ketua RW, 12 ketua RT) ──────────────────
const PEJABAT: {
  rt?: string; rw?: string; dusun?: string;
  ketua: string; jabatan: string;
}[] = [
  // 12 Ketua RT
  { rt: '001', rw: '001', dusun: 'Dusun Wage',      ketua: 'Bpk. Sarwono',           jabatan: 'Ketua RT 001' },
  { rt: '002', rw: '001', dusun: 'Dusun Wage',      ketua: 'Bpk. Darmawan',          jabatan: 'Ketua RT 002' },
  { rt: '003', rw: '001', dusun: 'Dusun Wage',      ketua: 'Bpk. Rahmat Hidayat',    jabatan: 'Ketua RT 003' },
  { rt: '004', rw: '002', dusun: 'Dusun Wage',      ketua: 'Bpk. Suroso',            jabatan: 'Ketua RT 004' },
  { rt: '005', rw: '002', dusun: 'Dusun Wage',      ketua: 'Bpk. Hendra Gunawan',    jabatan: 'Ketua RT 005' },
  { rt: '006', rw: '002', dusun: 'Dusun Wage',      ketua: 'Ibu Suminah',            jabatan: 'Ketua RT 006' },
  { rt: '007', rw: '003', dusun: 'Dusun Kliwon',    ketua: 'Bpk. Jaelani',           jabatan: 'Ketua RT 007' },
  { rt: '008', rw: '003', dusun: 'Dusun Kliwon',    ketua: 'Bpk. Wahyu Prabowo',     jabatan: 'Ketua RT 008' },
  { rt: '009', rw: '004', dusun: 'Dusun Kliwon',    ketua: 'Bpk. Ruslan Effendi',    jabatan: 'Ketua RT 009' },
  { rt: '010', rw: '004', dusun: 'Dusun Kliwon',    ketua: 'Ibu Marwati',            jabatan: 'Ketua RT 010' },
  { rt: '011', rw: '005', dusun: 'Dusun Kaligandu', ketua: 'Bpk. Sutrisno',          jabatan: 'Ketua RT 011' },
  { rt: '012', rw: '005', dusun: 'Dusun Kaligandu', ketua: 'Bpk. Bambang Irawan',    jabatan: 'Ketua RT 012' },
  // 5 Ketua RW
  { rw: '001', dusun: 'Dusun Wage',      ketua: 'Bpk. H. Sobirin',       jabatan: 'Ketua RW 001' },
  { rw: '002', dusun: 'Dusun Wage',      ketua: 'Bpk. Yusuf Hakim',      jabatan: 'Ketua RW 002' },
  { rw: '003', dusun: 'Dusun Kliwon',    ketua: 'Bpk. Edi Purnomo',      jabatan: 'Ketua RW 003' },
  { rw: '004', dusun: 'Dusun Kliwon',    ketua: 'Bpk. Maman Suherman',   jabatan: 'Ketua RW 004' },
  { rw: '005', dusun: 'Dusun Kaligandu', ketua: 'Bpk. Sugianto, S.Pd',   jabatan: 'Ketua RW 005' },
  // 3 Kepala Dusun
  { dusun: 'Dusun Wage',      ketua: 'Bpk. Agus Setiawan, S.IP',  jabatan: 'Kepala Dusun Wage' },
  { dusun: 'Dusun Kliwon',    ketua: 'Bpk. Deden Suhendi',         jabatan: 'Kepala Dusun Kliwon' },
  { dusun: 'Dusun Kaligandu', ketua: 'Ibu Nurhayati, A.Md',        jabatan: 'Kepala Dusun Kaligandu' },
];

const kadusList   = PEJABAT.filter((p) => !p.rt && !p.rw && p.dusun);
const ketuaRwList = PEJABAT.filter((p) => p.rw && !p.rt);
const ketuaRtList = PEJABAT.filter((p) => p.rt && p.rw);

// warna badge dusun
const DUSUN_COLOR: Record<string, string> = {
  'Dusun Wage':      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border dark:border-emerald-700/60',
  'Dusun Kliwon':    'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200 dark:border dark:border-sky-700/60',
  'Dusun Kaligandu': 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 dark:border dark:border-amber-700/60',
};

interface Citizen {
  id: string;
  fullName: string;
  nik: string;
  rt: string;
  rw: string;
  dusun: string;
  address: string;
  occupation: string;
  gender: string;
  phone?: string;
  email?: string;
  hasAccount?: boolean;
  isVerified?: boolean;
}

export default function VillageDatabasePanel() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loadingCitizens, setLoadingCitizens] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDusun, setFilterDusun] = useState('ALL');
  const [expandedRw, setExpandedRw] = useState<string | null>(null);
  const [showWarga, setShowWarga] = useState(false);

  useEffect(() => {
    fetch('/api/wilayah')
      .then((r) => r.json())
      .then((d) => setCitizens(d.citizens || []))
      .catch(() => {})
      .finally(() => setLoadingCitizens(false));
  }, []);

  const filteredCitizens = citizens.filter((c) => {
    const matchSearch =
      !search ||
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.nik.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase());
    const matchDusun = filterDusun === 'ALL' || c.dusun === filterDusun;
    return matchSearch && matchDusun;
  });

  const tiles = [
    { label: 'Jumlah Dusun', value: DESA.jumlahDusun, suffix: 'dusun', icon: <Home className="h-5 w-5" /> },
    { label: 'Jumlah RW',    value: DESA.jumlahRW,    suffix: 'RW',    icon: <Network className="h-5 w-5" /> },
    { label: 'Jumlah RT',    value: DESA.jumlahRT,    suffix: 'RT',    icon: <Users className="h-5 w-5" /> },
    { label: 'Warga Terdaftar', value: loadingCitizens ? '...' : citizens.length, suffix: 'warga', icon: <UserCheck className="h-5 w-5" /> },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-white dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xl shadow-slate-900/[0.05] space-y-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-emerald-400">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Database Wilayah {DESA.nama}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{DESA.kecamatan}, {DESA.kabupaten}, {DESA.provinsi}</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-300">
          <MapPin className="h-3.5 w-3.5" /> Kode Pos {DESA.kodePos}
        </span>
      </div>

      <div className="space-y-6 p-5 sm:p-6">

        {/* ── Tiles ringkasan ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{tile.label}</p>
                <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                  {tile.value}
                  <span className="ml-1 text-xs font-bold text-slate-400 dark:text-slate-500">{tile.suffix}</span>
                </h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {tile.icon}
              </div>
            </div>
          ))}
        </div>

        {/* ── Pimpinan Pemerintahan Desa ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Pimpinan Pemerintahan Desa
          </p>
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-[#13241d] p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors">
            <div>
              <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-700 dark:bg-emerald-600 text-white mb-1.5 shadow-xs">
                Kepala Desa (Kuwu)
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-emerald-50">{DESA.kepalaDesaName}</h4>
              <p className="text-[11px] font-medium text-slate-600 dark:text-emerald-300/90">NIP: 19740512 199803 1 002 · {DESA.nama}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-100 bg-emerald-100/90 dark:bg-emerald-900/60 border border-emerald-300/80 dark:border-emerald-600/70 px-3 py-1 rounded-xl inline-block shadow-xs">
                Penanggung Jawab &amp; Penandatangan SKTM
              </span>
            </div>
          </div>
        </div>

        {/* ── Kepala Dusun ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Kepala Dusun
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {kadusList.map((p) => (
              <div key={p.dusun} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${DUSUN_COLOR[p.dusun!] ?? 'bg-slate-100 text-slate-700'}`}>
                  {p.dusun}
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{p.ketua}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{p.jabatan}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Peta RW → RT + Ketua ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Peta RW &amp; RT — Ketua Wilayah
          </p>
          <div className="space-y-2">
            {DESA_RW_RT.map((row) => {
              const ketuaRw = ketuaRwList.find((p) => p.rw === row.rw);
              const isOpen = expandedRw === row.rw;
              return (
                <div key={row.rw} className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                  {/* Header RW */}
                  <button
                    type="button"
                    onClick={() => setExpandedRw(isOpen ? null : row.rw)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-emerald-400">RW {row.rw}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DUSUN_COLOR[row.dusun] ?? 'bg-slate-700 text-slate-200'}`}>
                        {row.dusun}
                      </span>
                      {ketuaRw && (
                        <span className="text-[11px] text-slate-300 hidden sm:inline">
                          Ketua: {ketuaRw.ketua}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-[10px]">{row.rt.length} RT</span>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Ketua RW mobile */}
                  {ketuaRw && (
                    <div className="sm:hidden px-4 py-1.5 bg-slate-800 text-[10px] text-slate-300">
                      Ketua RW: {ketuaRw.ketua}
                    </div>
                  )}

                  {/* Detail RT */}
                  {isOpen && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {row.rt.map((rtCode) => {
                        const ketuaRt = ketuaRtList.find((p) => p.rt === rtCode && p.rw === row.rw);
                        const wargaCount = citizens.filter((c) => c.rt.padStart(3,'0') === rtCode && c.rw.padStart(3,'0') === row.rw).length;
                        return (
                          <div key={rtCode} className="flex items-center justify-between px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              <span className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-700 dark:text-slate-200">
                                RT {rtCode}
                              </span>
                              <span className="text-xs text-slate-800 dark:text-slate-100 font-medium">
                                {ketuaRt?.ketua ?? '—'}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">{ketuaRt?.jabatan}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              {wargaCount} warga
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Daftar Warga Terdaftar ── */}
        <div>
          <button
            type="button"
            onClick={() => setShowWarga((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span className="text-sm font-bold">
                Daftar Warga Terdaftar {!loadingCitizens && `(${citizens.length} warga)`}
              </span>
            </div>
            {showWarga ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showWarga && (
            <div className="mt-3 space-y-3">
              {/* Filter & Search */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama, NIK, atau alamat..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <select
                  value={filterDusun}
                  onChange={(e) => setFilterDusun(e.target.value)}
                  className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Semua Dusun</option>
                  {DESA.dusun.map((d) => (
                    <option key={d.nama} value={d.nama}>{d.nama}</option>
                  ))}
                </select>
              </div>

              {/* Tabel warga */}
              {loadingCitizens ? (
                <div className="text-center py-8 text-slate-400 text-xs">Memuat data warga...</div>
              ) : filteredCitizens.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">Tidak ada warga ditemukan.</div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="px-4 py-3">No</th>
                        <th className="px-4 py-3">Nama</th>
                        <th className="px-4 py-3">NIK</th>
                        <th className="px-4 py-3">Alamat</th>
                        <th className="px-4 py-3 text-center">RT</th>
                        <th className="px-4 py-3 text-center">RW</th>
                        <th className="px-4 py-3">Dusun</th>
                        <th className="px-4 py-3">Pekerjaan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {filteredCitizens.map((c, i) => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="px-4 py-3 text-slate-400 font-mono">{i + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">{c.fullName}</td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{c.nik}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">{c.address}</td>
                          <td className="px-4 py-3 text-center font-mono text-slate-700 dark:text-slate-300">{c.rt}</td>
                          <td className="px-4 py-3 text-center font-mono text-slate-700 dark:text-slate-300">{c.rw}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DUSUN_COLOR[c.dusun] ?? 'bg-slate-100 text-slate-700'}`}>
                              {c.dusun.replace('Dusun ', '')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{c.occupation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Menampilkan {filteredCitizens.length} dari {citizens.length} warga terdaftar
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
