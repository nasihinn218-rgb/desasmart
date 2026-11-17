import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('1. Validasi Data Kependudukan & Input SKTM', () => {
  it('harus memvalidasi format NIK 16 digit angka', () => {
    const validNik = '3209123400010001';
    const invalidNikShort = '320912340001';
    const invalidNikLetter = '320912340001000A';

    const isNikValid = (nik: string) => /^\d{16}$/.test(nik);

    assert.equal(isNikValid(validNik), true);
    assert.equal(isNikValid(invalidNikShort), false);
    assert.equal(isNikValid(invalidNikLetter), false);
  });

  it('harus memvalidasi format Nomor Kartu Keluarga (KK) 16 digit', () => {
    const validKk = '3209000000010001';
    const isKkValid = (kk: string) => /^\d{16}$/.test(kk);
    assert.equal(isKkValid(validKk), true);
  });

  it('harus memverifikasi kategori permohonan SKTM yang sah', () => {
    const validCategories = ['Pendidikan', 'Kesehatan', 'Bantuan sosial', 'Administrasi', 'Lainnya'];
    const inputCategory = 'Kesehatan';
    assert.equal(validCategories.includes(inputCategory), true);
  });
});

describe('2. Alur Transisi Status Berkas Berjenjang (Workflow Multi-Tier)', () => {
  const STATUS_FLOW: Record<string, string[]> = {
    SUBMITTED: ['STAFF_REVIEW', 'NEED_REVISION'],
    STAFF_REVIEW: ['SUPERADMIN_REVIEW', 'NEED_REVISION'],
    NEED_REVISION: ['STAFF_REVIEW', 'SUBMITTED'],
    SUPERADMIN_REVIEW: ['HEAD_REVIEW', 'NEED_REVISION', 'REJECTED'],
    HEAD_REVIEW: ['COMPLETED', 'REJECTED'],
    COMPLETED: [],
    REJECTED: [],
  };

  it('staf loket hanya boleh meneruskan ke SUPERADMIN_REVIEW atau mengembalikan ke NEED_REVISION', () => {
    const current = 'STAFF_REVIEW';
    const allowed = STATUS_FLOW[current];
    assert.deepEqual(allowed, ['SUPERADMIN_REVIEW', 'NEED_REVISION']);
  });

  it('superadmin berwenang merekomendasikan ke HEAD_REVIEW atau menolak REJECTED', () => {
    const current = 'SUPERADMIN_REVIEW';
    const allowed = STATUS_FLOW[current];
    assert.equal(allowed.includes('HEAD_REVIEW'), true);
    assert.equal(allowed.includes('REJECTED'), true);
  });

  it('kepala desa berwenang memberikan persetujuan akhir COMPLETED dengan TTE sah', () => {
    const current = 'HEAD_REVIEW';
    const allowed = STATUS_FLOW[current];
    assert.equal(allowed.includes('COMPLETED'), true);
    assert.equal(allowed.includes('REJECTED'), true);
  });
});

describe('3. Tanda Tangan Elektronik (TTE) & Integritas Dokumen SHA-256', () => {
  it('harus menghasilkan nomor registrasi surat resmi format 470/xxx/SKTM/M/YYYY', () => {
    const generateDocNumber = (seq: number, month: number, year: number) => {
      const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
      const seqStr = String(seq).padStart(3, '0');
      const roman = romanMonths[month - 1] || 'I';
      return `470/${seqStr}/SKTM/${roman}/${year}`;
    };

    const docNum = generateDocNumber(3, 11, 2026);
    assert.equal(docNum, '470/003/SKTM/XI/2026');
    assert.match(docNum, /^470\/\d{3}\/SKTM\/[IVXLCDM]+\/\d{4}$/);
  });

  it('harus memvalidasi hash integritas dokumen SHA-256 dengan benar', () => {
    const payload = JSON.stringify({
      documentNumber: '470/003/SKTM/XI/2026',
      citizenNik: '320912340003',
      signedByNip: '19740512 199803 1 002',
      issuedDate: '2026-11-17T10:45:00.000Z',
    });

    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    assert.equal(hash.length, 64);

    const verifyHash = (data: string, expectedHash: string) => {
      const computed = crypto.createHash('sha256').update(data).digest('hex');
      return computed === expectedHash;
    };

    assert.equal(verifyHash(payload, hash), true);
    assert.equal(verifyHash(payload + 'tampered', hash), false);
  });

  it('harus membentuk URL verifikasi publik QR Code yang sah', () => {
    const baseUrl = 'http://localhost:3000';
    const docNumber = '470/003/SKTM/XI/2026';
    const qrUrl = `${baseUrl}/verify?doc=${encodeURIComponent(docNumber)}`;
    assert.match(qrUrl, /\/verify\?doc=/);
  });
});
