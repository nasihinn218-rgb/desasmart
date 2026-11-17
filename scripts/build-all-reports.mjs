import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const BASE_DIR = 'C:\\laragon\\www\\desasmart';
const PDF_DIR = path.join(BASE_DIR, 'laporan-pdf');
const PUBLIC_PDF_DIR = path.join(BASE_DIR, 'public', 'laporan-pdf');
const ARTIFACT_DIR = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\79d51885-3863-4b63-a2cc-ac35339316f0';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_PDF_DIR)) fs.mkdirSync(PUBLIC_PDF_DIR, { recursive: true });

// Read the master HTML
const masterHtmlPath = path.join(PDF_DIR, 'laporan_lengkap_obe_nasihin.html');
const masterHtml = fs.readFileSync(masterHtmlPath, 'utf8');

// Extract head and css
const headEndIdx = masterHtml.indexOf('</head>');
const headContent = masterHtml.substring(0, headEndIdx + 7);

// Function to compile html to pdf via Edge headless
const compileToPdf = (htmlContent, outputPath, artifactPath) => {
  const tmpHtml = outputPath.replace('.pdf', '.html');
  fs.writeFileSync(tmpHtml, htmlContent, 'utf8');
  const fileUri = `file:///${tmpHtml.replace(/\\/g, '/')}`;

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

  console.log(`Compiling: ${outputPath}...`);
  execFileSync(EDGE_PATH, args, { stdio: 'inherit' });
  const pubPath = path.join(PUBLIC_PDF_DIR, path.basename(outputPath));
  if (fs.existsSync(outputPath)) {
    fs.copyFileSync(outputPath, pubPath);
    if (artifactPath) fs.copyFileSync(outputPath, artifactPath);
    console.log(`SUCCESS: ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
  }
};

// Helper to make cover with custom title top
const makeCover = (titleTop) => {
  // Extract cover from masterHtml and replace cover-title-top
  const coverStart = masterHtml.indexOf('<div class="cover-page">');
  const coverEnd = masterHtml.indexOf('</div>\n\n<!-- ================= PAGE 2: KATA PENGANTAR', coverStart);
  let coverHtml = masterHtml.substring(coverStart, coverEnd + 6);

  // Replace title top
  coverHtml = coverHtml.replace(
    /<div class="cover-title-top">[\s\S]*?<\/div>/,
    `<div class="cover-title-top">\n    ${titleTop}\n  </div>`
  );
  return coverHtml;
};

// ================= 1. PRD / SRS =================
console.log('\n--- BUILDING DOCUMENT 1: PRD / SRS ---');
const doc1Cover = makeCover('LAPORAN TAHAP 1: PRD / SRS MANDIRI (IEEE 830)<br>REKAYASA PERANGKAT LUNAK (OBE)');
const doc1KataPengantar = `
<div class="page-break"></div>
<div class="section-header">KATA PENGANTAR</div>
<p>Puji dan syukur penulis panjatkan ke hadirat Allah SWT atas rahmat dan karunia-Nya, sehingga Laporan Tahap 1 <b>Product Requirements Document (PRD) &amp; Software Requirement Specification (SRS) Mandiri (IEEE 830)</b> untuk proyek pengembangan aplikasi <b>Desa Smart</b> dapat diselesaikan dengan baik dan tepat waktu.</p>
<p>Laporan ini disusun guna memenuhi luaran Tahap 1 pada Mata Kuliah <b>Rekayasa Perangkat Lunak (TIKB2503021)</b>, Program Studi S1 Teknik Informatika STMIK IKMI Cirebon. Dokumen ini memuat analisis kebutuhan sistem birokrasi Desa Silihasih, pemetaan 8 User Stories &amp; Acceptance Criteria, 20 Kebutuhan Fungsional (FR), Kebutuhan Non-Fungsional (NFR Keamanan SHA-256, Performa, Aksesibilitas), serta spesifikasi strategis modul Kecerdasan Artifisial (AI Engine).</p>
<p>Penulis menyampaikan terima kasih yang sebesar-besarnya kepada Bapak <b>Yudhistira Arie Wijaya, M.Kom., CDS.</b> selaku Dosen Pengampu atas bimbingan, arahan, dan transfer ilmu yang sangat berharga selama perkuliahan.</p>
<br>
<div style="float: right; text-align: center; width: 220px;">
  Cirebon, November 2026<br><br><br>
  <b>Nasihin (NIM: 41257143)</b>
</div>
<div style="clear: both;"></div>
`;

// Extract Bab 1 from masterHtml
const bab1Start = masterHtml.indexOf('<div class="section-header">BAB I: PRODUCT REQUIREMENTS DOCUMENT (PRD / SRS MANDIRI)</div>');
const bab1End = masterHtml.indexOf('<!-- ================= PAGE 8-9: BAB II & USE CASE DIAGRAM ================= -->');
const bab1Content = masterHtml.substring(bab1Start, bab1End);

const doc1FullHtml = `${headContent}
<body>
${doc1Cover}
${doc1KataPengantar}
<div class="page-break"></div>
${bab1Content}
</body>
</html>`;

compileToPdf(
  doc1FullHtml,
  path.join(PDF_DIR, '1_PRD_SRS_DesaSmart_Nasihin_41257143.pdf'),
  path.join(ARTIFACT_DIR, '1_PRD_SRS_DesaSmart_Nasihin_41257143.pdf')
);

// ================= 2. SDD =================
console.log('\n--- BUILDING DOCUMENT 2: SDD & ARSITEKTUR ---');
const doc2Cover = makeCover('LAPORAN TAHAP 2: SOFTWARE DESIGN DOCUMENT (SDD)<br>REKAYASA PERANGKAT LUNAK (OBE)');
const doc2KataPengantar = `
<div class="page-break"></div>
<div class="section-header">KATA PENGANTAR</div>
<p>Puji dan syukur penulis panjatkan ke hadirat Allah SWT, sehingga Laporan Tahap 2 <b>Software Design Document (SDD) &amp; Pemodelan Arsitektur</b> untuk sistem <b>Desa Smart</b> dapat diselesaikan dengan standar perancangan rekayasa perangkat lunak berorientasi objek yang utuh.</p>
<p>Laporan ini merinci pemodelan visual dan rancangan teknis yang mencakup 4 Diagram UML utama: Use Case Diagram dengan <b>6 Aktor Stick Figure Resmi</b> (Masyarakat, Staf Loket, AI Groq, Kasi Pelayanan, Kepala Desa, dan Publik/Pihak Ketiga) yang dilengkapi fitur Logout sistem, Activity Diagram 5 Swimlanes alur bisnis verifikasi AI, Class Diagram SOLID Clean Architecture, Sequence Diagram Multi-Tier, Entity-Relationship Diagram (ERD) 17 tabel relasional, serta showcase katalog desain UI/UX interaktif kanvas Figma (Frame 01 s.d. 06).</p>
<p>Ucapan terima kasih penulis haturkan kepada Bapak <b>Yudhistira Arie Wijaya, M.Kom., CDS.</b> selaku Dosen Pengampu atas panduan metodologi pemodelan perangkat lunak yang berbobot.</p>
<br>
<div style="float: right; text-align: center; width: 220px;">
  Cirebon, November 2026<br><br><br>
  <b>Nasihin (NIM: 41257143)</b>
</div>
<div style="clear: both;"></div>
`;

// Extract Bab 2 from masterHtml
const bab2Start = masterHtml.indexOf('<div class="section-header">BAB II: SOFTWARE DESIGN DOCUMENT (SDD) &amp; PEMODELAN ARSITEKTUR</div>');
const bab2End = masterHtml.indexOf('<!-- ================= PAGE 22: BAB III IMPLEMENTASI & TESTING ================= -->');
const bab2Content = masterHtml.substring(bab2Start, bab2End);

const doc2FullHtml = `${headContent}
<body>
${doc2Cover}
${doc2KataPengantar}
<div class="page-break"></div>
${bab2Content}
</body>
</html>`;

compileToPdf(
  doc2FullHtml,
  path.join(PDF_DIR, '2_SDD_DesaSmart_Nasihin_41257143.pdf'),
  path.join(ARTIFACT_DIR, '2_SDD_DesaSmart_Nasihin_41257143.pdf')
);

// ================= 3. TESTING & CI/CD =================
console.log('\n--- BUILDING DOCUMENT 3: PENGUJIAN & CI/CD ---');
const doc3Cover = makeCover('LAPORAN TAHAP 3: PENGUJIAN PERANGKAT LUNAK, TESTING &amp; DEVOPS CI/CD<br>REKAYASA PERANGKAT LUNAK (OBE)');
const doc3KataPengantar = `
<div class="page-break"></div>
<div class="section-header">KATA PENGANTAR</div>
<p>Puji dan syukur ke hadirat Allah SWT atas terselesaikannya Laporan Tahap 3 <b>Implementasi Kode, Integrasi AI, Testing &amp; DevOps CI/CD</b> untuk sistem <b>Desa Smart</b> dengan tingkat kelulusan pengujian unit test 100% (13 skenario lolos validasi otomatis).</p>
<p>Laporan ini mendokumentasikan konstruksi kode sumber berbasis Next.js 16 Clean Architecture, eksekusi unit test otomatis logika bisnis SKTM, otomatisasi pipeline CI/CD via GitHub Actions (Passing Green), petunjuk setup instalasi dan seeding data akun demo multi-peran, panduan video presentasi mandiri, serta kesimpulan dan refleksi pembelajaran software engineering.</p>
<p>Penulis menghaturkan apresiasi setinggi-tingginya kepada Bapak <b>Yudhistira Arie Wijaya, M.Kom., CDS.</b> atas arahan teknis dalam implementasi standar DevOps dan testing industri.</p>
<br>
<div style="float: right; text-align: center; width: 220px;">
  Cirebon, November 2026<br><br><br>
  <b>Nasihin (NIM: 41257143)</b>
</div>
<div style="clear: both;"></div>
`;

// Extract Bab 3, 4, 5 from masterHtml
const bab3Start = masterHtml.indexOf('<div class="section-header">BAB III: IMPLEMENTASI KODE, INTEGRASI AI, TESTING &amp; DEVOPS CI/CD</div>');
const bab3End = masterHtml.indexOf('</body>');
const bab3Content = masterHtml.substring(bab3Start, bab3End);

const doc3FullHtml = `${headContent}
<body>
${doc3Cover}
${doc3KataPengantar}
<div class="page-break"></div>
${bab3Content}
</body>
</html>`;

compileToPdf(
  doc3FullHtml,
  path.join(PDF_DIR, '3_Laporan_Pengujian_CICD_DesaSmart_Nasihin_41257143.pdf'),
  path.join(ARTIFACT_DIR, '3_Laporan_Pengujian_CICD_DesaSmart_Nasihin_41257143.pdf')
);

// ================= 4. MASTER FULL REPORT =================
console.log('\n--- VERIFYING DOCUMENT 4: LAPORAN LENGKAP OBE ---');
compileToPdf(
  masterHtml,
  path.join(PDF_DIR, '4_Laporan_Lengkap_RPL_DesaSmart_Nasihin_41257143.pdf'),
  path.join(ARTIFACT_DIR, '4_Laporan_Lengkap_RPL_DesaSmart_Nasihin_41257143.pdf')
);

console.log('\n>>> ALL 4 PDF REPORTS GENERATED AND SYNCHRONIZED PERFECTLY! <<<');
