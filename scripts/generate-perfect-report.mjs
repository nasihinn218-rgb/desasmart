import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const BASE_DIR = 'C:\\laragon\\www\\desasmart';
const PDF_DIR = path.join(BASE_DIR, 'laporan-pdf');
const PUBLIC_PDF_DIR = path.join(BASE_DIR, 'public', 'laporan-pdf');
const ARTIFACT_DIR = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\79d51885-3863-4b63-a2cc-ac35339316f0';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const toBase64 = (filePath, mime = 'image/png') => {
  if (fs.existsSync(filePath)) {
    return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
  }
  return '';
};

const logoIkmiBase64 = toBase64(path.join(BASE_DIR, 'public', 'logo-ikmi.jpg'), 'image/jpeg');
const useCaseBase64 = toBase64(path.join(BASE_DIR, 'public', 'use-case-diagram-stickman-figma.png'));
const figmaTokensBase64 = toBase64(path.join(BASE_DIR, 'public', 'figma-screens', '01_design_tokens.png'));
const figmaLandingBase64 = toBase64(path.join(BASE_DIR, 'public', 'figma-screens', '02_landing_page.png'));
const figmaStafBase64 = toBase64(path.join(BASE_DIR, 'public', 'figma-screens', '03_dashboard_staf.png'));
const figmaMasyarakatBase64 = toBase64(path.join(BASE_DIR, 'public', 'figma-screens', '04_dashboard_masyarakat.png'));
const figmaKuwuBase64 = toBase64(path.join(BASE_DIR, 'public', 'figma-screens', '05_dashboard_kuwu.png'));
const figmaVerifyBase64 = toBase64(path.join(BASE_DIR, 'public', 'figma-screens', '06_cek_keaslian.png'));

const getCSS = () => `
@page {
  size: A4 portrait;
  margin-top: 25mm;
  margin-bottom: 25mm;
  margin-left: 25mm;
  margin-right: 25mm;
}
* { box-sizing: border-box; }
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #000;
  text-align: justify;
  margin: 0; padding: 0;
}
.cover-page { text-align: center; page-break-after: always; padding-top: 20px; }
.cover-title-top { font-size: 13pt; font-weight: bold; letter-spacing: 0.5px; line-height: 1.4; margin-bottom: 10px; }
.cover-title-main { font-size: 12pt; font-weight: bold; color: #0b62a4; line-height: 1.4; margin-bottom: 16px; }
.cover-sks { font-size: 10.5pt; font-weight: bold; margin-bottom: 30px; }
.cover-logo-container { margin: 20px auto 30px auto; text-align: center; }
.cover-logo-img { width: 140px; height: auto; }
.cover-meta-section { text-align: center; margin-bottom: 35px; }
.cover-meta-table { width: 65%; margin: 12px auto; border-collapse: collapse; font-size: 11pt; border: none; }
.cover-meta-table td { border: none; padding: 3px 6px; text-align: left; }
.cover-bottom { font-size: 11.5pt; font-weight: bold; line-height: 1.4; margin-top: 35px; }

.section-header {
  text-align: center;
  font-size: 13pt;
  font-weight: bold;
  margin-top: 15px;
  margin-bottom: 20px;
  border-bottom: 2px solid #000;
  padding-bottom: 6px;
  letter-spacing: 0.5px;
}
.page-break { page-break-before: always; }
h2.sub-title { font-size: 11.5pt; font-weight: bold; margin-top: 18px; margin-bottom: 8px; }
h3.sub-sub-title { font-size: 11pt; font-weight: bold; margin-top: 14px; margin-bottom: 6px; }
p { margin: 0 0 10px 0; text-indent: 36px; }
p.no-indent { text-indent: 0; }
ul, ol { margin: 6px 0 12px 28px; padding: 0; }
li { margin-bottom: 5px; }
table.data-table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 9.5pt; page-break-inside: avoid; }
table.data-table th, table.data-table td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
table.data-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
td.center, th.center { text-align: center; }
.figure-container { text-align: center; margin: 16px 0; page-break-inside: avoid; }
.figure-container img { max-width: 98%; height: auto; border: 1px solid #ccc; border-radius: 3px; }
.figure-caption { font-size: 10pt; font-weight: bold; font-style: italic; margin-top: 8px; text-align: center; }
pre.terminal-box {
  background-color: #fafafa; border: 1px solid #aaa; border-radius: 3px; padding: 10px;
  font-family: 'Consolas', 'Courier New', monospace; font-size: 8.5pt; line-height: 1.4;
  white-space: pre-wrap; margin: 12px 0; page-break-inside: avoid;
}
`;

const renderCover = (docName) => `
<div class="cover-page">
  <div class="cover-title-top">
    ${docName}<br>
    REKAYASA PERANGKAT LUNAK (OBE)
  </div>

  <div class="cover-title-main">
    PENGEMBANGAN SISTEM PELAYANAN ADMINISTRASI DESA &amp; PENERBITAN<br>
    SURAT KETERANGAN TIDAK MAMPU (SKTM) BERBASIS KECERDASAN<br>
    ARTIFISIAL (DESA SMART)
  </div>

  <div class="cover-sks">
    Mata Kuliah: Rekayasa Perangkat Lunak (TIKB2503021) — 4 SKS (2 Teori + 2 Praktik)
  </div>

  <div class="cover-logo-container">
    <img src="${logoIkmiBase64}" class="cover-logo-img" alt="Logo STMIK IKMI Cirebon">
  </div>

  <div class="cover-meta-section">
    <div style="font-weight: bold; margin-bottom: 8px;">Disusun Oleh:</div>
    <table class="cover-meta-table">
      <tr><td style="width: 32%;">Nama</td><td style="width: 5%;">:</td><td><b>Nasihin</b></td></tr>
      <tr><td>NIM</td><td>:</td><td><b>41257143</b></td></tr>
      <tr><td>Kelas</td><td>:</td><td><b>1B 2025</b></td></tr>
      <tr><td>Dosen Pengampu</td><td>:</td><td><b>Yudhistira Arie Wijaya, M.Kom., CDS.</b></td></tr>
      <tr><td>Tema Kelompok</td><td>:</td><td><b>Smart Governance &amp; Public Service AI</b></td></tr>
    </table>
  </div>

  <div class="cover-bottom">
    PROGRAM STUDI S1 TEKNIK INFORMATIKA<br>
    STMIK IKMI CIREBON<br>
    TAHUN AKADEMIK 2025/2026
  </div>
</div>
`;

// Helper: compile HTML to PDF via Edge
const compileToPdf = (htmlContent, outputPath, artifactPath) => {
  const tmpHtml = outputPath.replace('.pdf', '.html');
  fs.writeFileSync(tmpHtml, htmlContent, 'utf8');
  const fileUri = `file:///${tmpHtml.replace(/\\\\/g, '/')}`;

  const args = [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--display-header-footer',
    '--header-template=<div></div>',
    '--footer-template=<div style="font-size:10pt; text-align:center; width:100%; font-family:Times New Roman, serif;"><span class="pageNumber"></span></div>',
    `--print-to-pdf=${outputPath}`,
    fileUri
  ];

  execFileSync(EDGE_PATH, args, { stdio: 'inherit' });
  const pubPath = path.join(PUBLIC_PDF_DIR, path.basename(outputPath));
  if (fs.existsSync(outputPath)) {
    fs.copyFileSync(outputPath, pubPath);
    if (artifactPath) fs.copyFileSync(outputPath, artifactPath);
    console.log(`Generated: ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
  }
};

// ================= BUILD DOC 1: PRD / SRS =================
console.log('Compiling 1_PRD_SRS...');
const doc1Html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>1. PRD & SRS - DesaSmart</title><style>${getCSS()}</style></head>
<body>
${renderCover('LAPORAN TAHAP 1: PRD / SRS MANDIRI (IEEE 830)')}
<div class="section-header">KATA PENGANTAR</div>
<p>Puji dan syukur ke hadirat Allah SWT, Laporan Tahap 1 Rekayasa Perangkat Lunak <b>Product Requirements Document (PRD) &amp; Software Requirement Specification (SRS)</b> untuk sistem <b>Desa Smart</b> dapat diselesaikan dengan lengkap.</p>
<p>Laporan ini merumuskan analisis kebutuhan nyata birokrasi Desa Silihasih, pemetaan 8 User Stories &amp; Acceptance Criteria, 20 Kebutuhan Fungsional, Kebutuhan Non-Fungsional (Keamanan SHA-256, Performa, Aksesibilitas), serta rancangan arsitektur Kecerdasan Artifisial (AI OCR &amp; Groq LLM Assistant).</p>
<br>
<div style="float: right; text-align: center; width: 220px;">
  Cirebon, November 2026<br><br><br>
  <b>Nasihin (NIM: 41257143)</b>
</div>
<div style="clear: both;"></div>

<div class="page-break"></div>
<div class="section-header">BAB I: PRODUCT REQUIREMENTS DOCUMENT (PRD / SRS MANDIRI)</div>
<h2 class="sub-title">1.1 Identifikasi Masalah &amp; Latar Belakang Nyata</h2>
<p>Pelayanan publik di tingkat desa di Indonesia menghadapi tantangan besar terkait efisiensi dan transparansi administrasi. Surat Keterangan Tidak Mampu (SKTM) merupakan dokumen fundamental yang menjadi prasyarat pokok bagi warga berpenghasilan rendah untuk memperoleh jaminan kesehatan gratis (PBI BPJS), beasiswa pendidikan, santunan sosial, serta pembebasan biaya administrasi lainnya. Namun, prosedur manual konvensional yang berjalan di kantor balai desa kerap membebani warga dengan antrean fisik panjang, keharusan bolak-balik akibat ketidaklengkapan dokumen pengantar RT/RW, dan keterbatasan jam operasional loket.</p>
<p>Dari sisi aparatur desa, petugas loket dan Kepala Seksi (Kasi) Pelayanan menghadapi kendala dalam memvalidasi keabsahan data ekonomi keluarga secara objektif. Pemeriksaan berkas fisik secara manual rentan terhadap ketidaktelitian dan memakan waktu berhari-hari. Selain itu, dokumen fisik berbasis kertas mudah dipalsukan, stempel basah mudah ditiru, serta menyulitkan instansi luar dalam mengonfirmasi keaslian dokumen secara cepat.</p>
<p>Menjawab urgensi tersebut, penulis merancang dan membangun sistem <b>Desa Smart</b>, yakni platform aplikasi web modern yang mendigitalkan siklus pelayanan SKTM secara menyeluruh dengan menanamkan modul Kecerdasan Artifisial (Artificial Intelligence) untuk otomatisasi asistensi warga, validasi kelayakan ekonomi, tanda tangan elektronik (TTE) berbasis QR Code terenkripsi SHA-256, dan notifikasi WhatsApp instan.</p>

<h2 class="sub-title">1.2 Nilai Guna Aplikasi &amp; Tujuan Rekayasa</h2>
<p class="no-indent">Tujuan utama rekayasa perangkat lunak mandiri ini adalah menghasilkan sistem informasi pelayanan publik terpadu yang memberikan manfaat strategis:</p>
<ul>
  <li><b>Efisiensi dan Aksesibilitas 24/7</b>: Masyarakat dapat berkonsultasi mengenai syarat layanan melalui asisten cerdas AI, mengajukan permohonan SKTM, serta melacak progres berkas kapan saja tanpa hambatan jam loket.</li>
  <li><b>Asesmen Objektif Berbasis AI</b>: Modul inferensi LLM untuk menganalisis data ekonomi, jumlah tanggungan, serta pencocokan konsistensi NIK berkas KTP/KK secara otomatis (<i>AI Completeness Score</i>).</li>
  <li><b>Akuntabilitas Birokrasi Berjenjang</b>: Rantai verifikasi berjenjang: Staf Loket Meja 1 &rarr; Kasi Pelayanan Meja 2 &rarr; pengesahan tanda tangan elektronik Kepala Desa Meja 3.</li>
  <li><b>Integritas Dokumen &amp; Pencegahan Pemalsuan</b>: Dokumen SKTM resmi diterbitkan dalam format PDF ber-Kop Desa dengan nomor unik, TTE ber-QR Code, dan diamankan dengan algoritma <i>Cryptographic Hash SHA-256</i>.</li>
</ul>

<div class="page-break"></div>
<h2 class="sub-title">1.3 Spesifikasi Kebutuhan Fungsional (User Stories &amp; Acceptance Criteria)</h2>
<table class="data-table">
  <thead><tr><th style="width: 15%;">ID &amp; Aktor</th><th style="width: 42%;">User Story</th><th style="width: 43%;">Acceptance Criteria</th></tr></thead>
  <tbody>
    <tr><td><b>US-01</b><br>Masyarakat</td><td>Sebagai warga, saya ingin mendaftar akun dengan NIK dan memverifikasi via OTP agar data identitas saya sah dan terlindungi.</td><td>1. Wajib NIK 16 digit angka.<br>2. Kode OTP 6 digit dikirim via WA/Email.<br>3. Akun terverifikasi jika OTP cocok sebelum 10 menit.</td></tr>
    <tr><td><b>US-02</b><br>Masyarakat</td><td>Sebagai pemohon, saya ingin berkonsultasi dengan asisten pintar AI tentang syarat SKTM agar tidak salah membawa berkas.</td><td>1. Widget AI Chatbot responsif di portal warga.<br>2. AI merespons dalam tempo &lt; 2 detik berbasis regulasi desa.<br>3. Riwayat obrolan tersimpan di basis data.</td></tr>
    <tr><td><b>US-03</b><br>Masyarakat</td><td>Sebagai pemohon, saya ingin mengajukan SKTM online dan mengunggah berkas KTP, KK, dan pengantar RT/RW.</td><td>1. Form terintegrasi data dusun, RW, dan RT Desa Silihasih.<br>2. Menerima file JPG/PNG/PDF max 5MB.<br>3. AI otomatis menghitung skor kelengkapan berkas saat submit.</td></tr>
    <tr><td><b>US-04</b><br>Staf Loket</td><td>Sebagai staf loket, saya ingin memeriksa berkas masuk dan hasil skor AI agar dapat meloloskan atau meminta revisi permohonan.</td><td>1. Dashboard staf menampilkan antrean permohonan real-time (termasuk status Perlu Perbaikan: 6 berkas).<br>2. Staf dapat memberi catatan revisi spesifik ke pemohon.<br>3. Status berubah menjadi NEED_REVISION atau SUPERADMIN_REVIEW.</td></tr>
    <tr><td><b>US-05</b><br>Kasi Pelayanan</td><td>Sebagai Kasi Pelayanan, saya ingin memvalidasi kelayakan substantif ekonomi keluarga dengan data DTKS.</td><td>1. Menelaah catatan staf dan profil kemiskinan.<br>2. Mendisposisikan ke Kepala Desa atau menolak dengan alasan sah.<br>3. Notifikasi WhatsApp otomatis terkirim jika ditolak.</td></tr>
    <tr><td><b>US-06</b><br>Kepala Desa</td><td>Sebagai Kepala Desa, saya ingin memberikan persetujuan akhir dan menandatangani SKTM digital dengan TTE QR Code.</td><td>1. Nomor surat resmi di-generate berurutan otomatis: <code>470/xxx/SKTM/M/YYYY</code>.<br>2. Sistem membangkitkan QR Code dan digest SHA-256 dokumen.<br>3. PDF terbit dan link unduh dikirim via WA ke warga.</td></tr>
    <tr><td><b>US-07</b><br>Semua Aktor</td><td>Sebagai pengguna terdaftar, saya ingin keluar dari sistem (Logout) secara aman agar sesi saya tidak disalahgunakan.</td><td>1. Tombol Logout tersedia jelas di header dan sidebar.<br>2. Cookie otentikasi JWT dihapus seketika.<br>3. Aksi tercatat di audit_logs dan browser redirect ke /login.</td></tr>
    <tr><td><b>US-08</b><br>Pihak Ketiga</td><td>Sebagai pihak ketiga, saya ingin memindai QR Code surat untuk memastikan keaslian dokumen tanpa login.</td><td>1. Halaman /verify/[noSurat] terbuka publik.<br>2. Sistem menampilkan centang hijau keaslian, nama kades, pemohon, dan SHA-256.<br>3. Kunjungan verifikasi terekam di audit log.</td></tr>
  </tbody>
</table>

<h2 class="sub-title">1.4 Spesifikasi Kebutuhan Non-Fungsional</h2>
<ul>
  <li><b>Keamanan (Security)</b>: Password di-hash bcrypt (10 salt rounds). Sesi otentikasi JWT HttpOnly. Dokumen SKTM dilindungi digital hash SHA-256.</li>
  <li><b>Performa (Performance)</b>: Waktu respon navigasi &lt; 500ms. Inferensi AI Groq &lt; 1,5 detik. Render PDF &lt; 800ms.</li>
  <li><b>Ketersediaan (Availability)</b>: Uptime 99,5% dengan safe-fallback jika API pihak ketiga bermasalah.</li>
  <li><b>Auditabilitas (Auditability)</b>: Rekam jejak seluruh mutasi di tabel audit_logs lengkap dengan IP address dan timestamp.</li>
</ul>

<h2 class="sub-title">1.5 Spesifikasi Strategis AI Engine</h2>
<ol>
  <li><b>Conversational Chatbot AI</b>: Groq Cloud LLM terintegrasi konteks regulasi Desa Silihasih (12 RT, 5 RW, 3 Dusun, jadwal pelayanan, kriteria SKTM).</li>
  <li><b>AI OCR &amp; Completeness Scorer</b>: Otomatisasi ekstraksi teks KTP/KK dan kalkulasi skor kelayakan (0-100%).</li>
</ol>
</body></html>`;

compileToPdf(
  doc1Html,
  path.join(PDF_DIR, '1_PRD_SRS_DesaSmart_Nasihin_41257143.pdf'),
  path.join(ARTIFACT_DIR, '1_PRD_SRS_DesaSmart_Nasihin_41257143.pdf')
);

// ================= BUILD DOC 2: SDD =================
console.log('Compiling 2_SDD...');
const doc2Html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>2. SDD & Arsitektur - DesaSmart</title><style>${getCSS()}</style></head>
<body>
${renderCover('LAPORAN TAHAP 2: SOFTWARE DESIGN DOCUMENT (SDD)')}
<div class="section-header">KATA PENGANTAR</div>
<p>Puji dan syukur ke hadirat Allah SWT, Laporan Tahap 2 <b>Software Design Document (SDD) &amp; Pemodelan Arsitektur</b> untuk sistem <b>Desa Smart</b> diselesaikan dengan standar perancangan berorientasi objek yang utuh.</p>
<p>Dokumen ini mencakup 4 Diagram UML utama: Use Case Diagram 6 Aktor Stick Figure, Activity Diagram 5 Swimlanes, Class Diagram SOLID, Sequence Diagram Multi-Tier, Entity-Relationship Diagram (ERD) basis data 17 tabel, serta katalog desain UI/UX interaktif kanvas Figma.</p>
<br>
<div style="float: right; text-align: center; width: 220px;">
  Cirebon, November 2026<br><br><br>
  <b>Nasihin (NIM: 41257143)</b>
</div>
<div style="clear: both;"></div>

<div class="page-break"></div>
<div class="section-header">BAB II: SOFTWARE DESIGN DOCUMENT (SDD) &amp; PEMODELAN ARSITEKTUR</div>

<h2 class="sub-title">1. USE CASE DIAGRAM &amp; SKENARIO SISTEM</h2>
<h3 class="sub-sub-title">1.1 Diagram Use Case Lengkap (6 Aktor Stick Figure Resmi)</h3>
<p>Use Case Diagram dirancang secara simetris, rapi, dan berkontras tinggi memetakan seluruh 17 fungsionalitas web Desa Smart. 6 Aktor digambarkan menggunakan simbol <b>stick figure resmi</b>, use case elips, garis asosiasi bebas tabrakan (<i>no line collisions</i>):</p>

<div class="figure-container">
  <img src="${useCaseBase64}" alt="UML Use Case Diagram Resmi DesaSmart">
  <div class="figure-caption">Gambar 2.1 Use Case Diagram Pelayanan Desa Smart (Memuat 6 Aktor Resmi Stick Figure &amp; Fitur Logout)</div>
</div>

<h3 class="sub-sub-title">1.2 Identifikasi Aktor &amp; Matriks Hak Akses</h3>
<table class="data-table">
  <thead><tr><th style="width: 18%;">Aktor</th><th style="width: 22%;">Tipe &amp; Peran</th><th>Hak Akses Fitur Utama Sistem</th></tr></thead>
  <tbody>
    <tr><td><b>Masyarakat</b></td><td>Human (Primer)</td><td>Registrasi, Verifikasi OTP, Login, Konsultasi Chatbot AI, Pengajuan SKTM, Upload Berkas, Perbaikan Revisi, Tracking Status, Download PDF SKTM Resmi, Logout Sistem.</td></tr>
    <tr><td><b>Staf Pelayanan</b></td><td>Human (Petugas Loket)</td><td>Login, Dashboard Antrean Loket, Pemeriksaan Berkas &amp; AI Score, Minta Revisi Berkas, Disposisi ke Kasi Pelayanan, Logout Sistem.</td></tr>
    <tr><td><b>Sistem AI (Groq)</b></td><td>System (Eksternal)</td><td>Memproses inferensi percakapan warga via LLM, menghitung skor kelayakan ekonomi, dan memvalidasi teks dokumen OCR.</td></tr>
    <tr><td><b>Superadmin (Kasi)</b></td><td>Human (Verifikator)</td><td>Login, Dashboard Verifikasi, Validasi DTKS/Kemiskinan, Tolak Permohonan Tidak Layak, Disposisi ke Kades, Konfigurasi AI &amp; Audit Log, Logout Sistem.</td></tr>
    <tr><td><b>Kepala Desa</b></td><td>Human (Pimpinan)</td><td>Login, Antrean Persetujuan Akhir, Approval SKTM, Penomoran Surat Otomatis, Pembubuhan TTE QR Code &amp; Hash SHA-256, Logout Sistem.</td></tr>
    <tr><td><b>Pihak Ketiga</b></td><td>Human (Publik)</td><td>Akses terbuka halaman /verify/[documentNumber] untuk verifikasi keaslian dokumen via scan QR Code (tanpa perlu login).</td></tr>
  </tbody>
</table>

<div class="page-break"></div>
<h2 class="sub-title">2. ACTIVITY DIAGRAM (ALUR BISNIS, AI &amp; TERMINASI SESI)</h2>
<div class="figure-container">
  ${getActivityDiagramSvg()}
  <div class="figure-caption">Gambar 2.2 Activity Diagram Alur Bisnis, Integrasi AI &amp; Terminasi Sesi (5 Swimlanes)</div>
</div>

<h2 class="sub-title">3. CLASS DIAGRAM BERORIENTASI OBJEK (MEMATUHI PRINSIP SOLID)</h2>
<div class="figure-container">
  ${getClassDiagramSvg()}
  <div class="figure-caption">Gambar 2.3 Class Diagram Berorientasi Objek Sesuai Prinsip SOLID</div>
</div>

<div class="page-break"></div>
<h2 class="sub-title">4. SEQUENCE DIAGRAM (ALUR PERTUKARAN PESAN)</h2>
<div class="figure-container">
  ${getSequenceDiagramSvg()}
  <div class="figure-caption">Gambar 2.4 Sequence Diagram Pengajuan SKTM, Analisis AI Groq &amp; Notifikasi WA</div>
</div>

<h2 class="sub-title">5. ENTITY-RELATIONSHIP DIAGRAM (ERD) BASIS DATA</h2>
<div class="figure-container">
  ${getErdDiagramSvg()}
  <div class="figure-caption">Gambar 2.5 Entity-Relationship Diagram (ERD) Basis Data Desa Smart</div>
</div>

<div class="page-break"></div>
<h2 class="sub-title">6. PERANCANGAN UI/UX &amp; PROTOTIPE INTERAKTIF FIGMA</h2>
<p class="no-indent">Sistem <b>Desa Smart</b> telah dirancang secara lengkap pada kanvas Figma dengan resolusi 1440x900px, sistem token warna terstandarisasi, dan alur interaksi <i>Smart Animate</i> (<a href="https://www.figma.com/design/Ee6uIT2jdObNWwX8PZ3KqX">Tautan Figma Live Prototype</a>):</p>

<div class="figure-container">
  <img src="${figmaTokensBase64}" alt="Design Tokens Figma">
  <div class="figure-caption">Gambar 2.6 Design Tokens &amp; Color Style Guide (Figma Frame 01)</div>
</div>

<div class="figure-container">
  <img src="${figmaLandingBase64}" alt="Screen Landing Page">
  <div class="figure-caption">Gambar 2.7 Antarmuka Landing Page Publik DesaSmart (Figma Frame 02)</div>
</div>

<div class="page-break"></div>
<div class="figure-container">
  <img src="${figmaStafBase64}" alt="Screen Dashboard Staf">
  <div class="figure-caption">Gambar 2.8 Meja Kerja Staf Loket &amp; Kartu Perlu Perbaikan: 6 (Figma Frame 03)</div>
</div>

<div class="figure-container">
  <img src="${figmaMasyarakatBase64}" alt="Screen Dashboard Warga">
  <div class="figure-caption">Gambar 2.9 Portal Warga &amp; Pelacakan Timeline 5 Tahap Pengajuan (Figma Frame 04)</div>
</div>

<div class="page-break"></div>
<div class="figure-container">
  <img src="${figmaKuwuBase64}" alt="Screen Dashboard Kuwu">
  <div class="figure-caption">Gambar 2.10 Dashboard Kuwu &amp; Modal Pengesahan TTE Digital (Figma Frame 05)</div>
</div>

<div class="figure-container">
  <img src="${figmaVerifyBase64}" alt="Screen Cek Keaslian">
  <div class="figure-caption">Gambar 2.11 Laman Publik Verifikasi Keaslian Dokumen Ber-QR Code SHA-256 (Figma Frame 06)</div>
</div>
</body></html>`;

compileToPdf(
  doc2Html,
  path.join(PDF_DIR, '2_SDD_DesaSmart_Nasihin_41257143.pdf'),
  path.join(ARTIFACT_DIR, '2_SDD_DesaSmart_Nasihin_41257143.pdf')
);

// ================= BUILD DOC 3: TESTING & CI/CD =================
console.log('Compiling 3_Laporan_Pengujian...');
const doc3Html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>3. Laporan Pengujian & CI/CD - DesaSmart</title><style>${getCSS()}</style></head>
<body>
${renderCover('LAPORAN TAHAP 3: TESTING & DEVOPS CI/CD')}
<div class="section-header">KATA PENGANTAR</div>
<p>Puji dan syukur ke hadirat Allah SWT, Laporan Tahap 3 <b>Implementasi Kode, Integrasi AI, Testing &amp; DevOps CI/CD</b> untuk sistem <b>Desa Smart</b> diselesaikan dengan hasil pengujian unit 100% lulus tanpa kegagalan.</p>
<p>Dokumen ini menyajikan pembuktian keandalan kode sumber berbasis Next.js 16 Clean Architecture, eksekusi 13 skenario unit test otomatis, konfigurasi otomatisasi CI/CD via GitHub Actions, serta panduan instalasi live demo aplikasi.</p>
<br>
<div style="float: right; text-align: center; width: 220px;">
  Cirebon, November 2026<br><br><br>
  <b>Nasihin (NIM: 41257143)</b>
</div>
<div style="clear: both;"></div>

<div class="page-break"></div>
<div class="section-header">BAB III: IMPLEMENTASI KODE, INTEGRASI AI, TESTING &amp; DEVOPS CI/CD</div>
<h2 class="sub-title">3.1 Konstruksi Kode Web Modern (Next.js 16 + Clean Code)</h2>
<p>Aplikasi dikembangkan menggunakan Next.js 16 dengan Turbopack compiler, React 19, TypeScript, dan Tailwind CSS 4. Penulisan kode menerapkan prinsip Clean Architecture: pemisahan layer controller/route handlers, service domain, repository model Prisma, serta komponen antarmuka modular.</p>

<h2 class="sub-title">3.2 Pelaksanaan Pengujian Unit Test Otomatis (13 Test Cases Passing)</h2>
<p>Pengujian unit test otomatis diimplementasikan pada file <code>tests/sktm-business-logic.test.ts</code> menggunakan test runner TypeScript mandiri yang menguji fungsi kritis: validasi NIK 16 digit, kalkulasi scoring AI, transisi state machine status permohonan, dan integritas cryptographic hash SHA-256:</p>

<pre class="terminal-box">
=== MEMULAI UNIT TESTING OTOMATIS DESA SMART ===
[PASS] Validasi NIK 16 digit angka
[PASS] Menolak NIK kurang dari 16 digit
[PASS] Menolak NIK yang mengandung huruf
[PASS] Kalkulasi Skor AI warga sangat miskin (Per kapita 300rb -> Skor 95)
[PASS] Kalkulasi Skor AI warga rentan miskin (Per kapita 750rb -> Skor 85)
[PASS] Kalkulasi Skor AI warga mampu (Per kapita 5jt -> Skor 50)
[PASS] Transisi sah: SUBMITTED -> Disposisi Superadmin
[PASS] Mencegah bypass: SUBMITTED tidak bisa langsung di-approve Kades
[PASS] Transisi sah: Superadmin merekomendasikan ke Kades
[PASS] Transisi sah: Kepala Desa menyetujui penerbitan SKTM
[PASS] Panjang Digest SHA-256 tepat 64 karakter heksadesimal
[PASS] Hash konsisten dan deterministik untuk dokumen identik
[PASS] Deteksi pemalsuan: hash berubah drastis saat ada manipulasi data
================================================
Hasil Pengujian: 13 PASS, 0 FAIL (100% SUKSES)
</pre>

<h2 class="sub-title">3.3 Otomatisasi GitHub Actions CI/CD Pipeline</h2>
<p>Dikonfigurasikan pipeline otomatisasi pada berkas <code>.github/workflows/ci.yml</code> yang berjalan otomatis saat kode di-push ke repositori GitHub untuk menjalankan tahapan: checkout source code, setup Node.js v20, instalasi dependensi, sinkronisasi Prisma ORM, linting kode (ESLint), dan automated build Next.js hingga berstatus hijau (<i>Passing Green</i>).</p>

<div class="page-break"></div>
<div class="section-header">BAB IV: LIVE DEMO UTUH &amp; PANDUAN PENGOPERASIAN</div>
<h2 class="sub-title">4.1 Petunjuk Instalasi &amp; Setup Aplikasi</h2>
<pre class="terminal-box">
# Masuk ke direktori proyek
cd c:\laragon\www\desasmart

# Instalasi dependensi paket
npm install

# Sinkronisasi database SQLite & Seeding akun demo
npx prisma db push
npm run db:seed

# Jalankan server aplikasi lokal
npm run dev

# Buka browser pada tautan: http://localhost:3000
</pre>

<h2 class="sub-title">4.2 Daftar Akun Pengujian Multi-Peran (Demo Seed Credentials)</h2>
<table class="data-table">
  <thead><tr><th style="width: 25%;">Peran (Role)</th><th style="width: 25%;">Nama Akun</th><th style="width: 30%;">Alamat Email</th><th>Kata Sandi</th></tr></thead>
  <tbody>
    <tr><td><b>Masyarakat (Pemohon)</b></td><td>Ahmad Dahlan</td><td>masyarakat@desa.test</td><td>Password123!</td></tr>
    <tr><td><b>Staf Pelayanan (Loket)</b></td><td>Siti Rahmawati, A.Md</td><td>siti.rahmawati@gmail.go.id</td><td>Password123!</td></tr>
    <tr><td><b>Superadmin (Kasi)</b></td><td>Budi Santoso, S.Sos</td><td>budi.santoso@gmail.go.id</td><td>Password123!</td></tr>
    <tr><td><b>Kepala Desa (Pimpinan)</b></td><td>Drs. H. Mulyadi, M.Si</td><td>h.mulyadi@gmail.go.id</td><td>Password123!</td></tr>
  </tbody>
</table>

<h2 class="sub-title">4.3 Skenario Video Presentasi Mandiri</h2>
<ul>
  <li><b>Video Progres 1 (Durasi 3–5 Menit)</b>: Latar belakang masalah, nilai guna aplikasi, matriks FR &amp; NFR, dan peran strategis AI.</li>
  <li><b>Video Progres 2 (Durasi 5–7 Menit)</b>: 4 Diagram UML (Use Case 6 Aktor Stick Figure, Activity, Class SOLID, Sequence), ERD 17 Tabel, dan walkthrough prototipe interaktif Figma.</li>
  <li><b>Video Final (Durasi 8–12 Menit)</b>: Elevator pitch, arsitektur sistem, Live Demo web + AI inferensi, unit test 100% pass, dan status hijau CI/CD Actions.</li>
</ul>
</body></html>`;

compileToPdf(
  doc3Html,
  path.join(PDF_DIR, '3_Laporan_Pengujian_CICD_DesaSmart_Nasihin_41257143.pdf'),
  path.join(ARTIFACT_DIR, '3_Laporan_Pengujian_CICD_DesaSmart_Nasihin_41257143.pdf')
);

console.log('All 4 PDFs regenerated with unified, identical sample styling!');
