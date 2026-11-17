import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { DESA } from '@/lib/desa-config';

export interface SktmDocumentData {
  documentNumber: string;
  applicantName: string;
  nik: string;
  noKk: string;
  birthPlace: string;
  birthDate: string; // e.g. "15 April 1992"
  gender: string;
  occupation: string;
  address: string;
  purposeCategory: string;
  purposeDescription: string;
  villageName: string;
  districtName: string;
  regencyName: string;
  villageAddress: string;
  villagePhone: string;
  headVillageName: string;
  headVillageNip?: string;
  issuedDate: string; // e.g. "06 Oktober 2026"
  verificationUrl: string;
}

export async function generateSktmPdfBuffer(data: SktmDocumentData): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // 1. KOP SURAT RESMI PEMERINTAH DESA
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text(`PEMERINTAH ${data.regencyName.toUpperCase()}`, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(13);
  doc.text(`KECAMATAN ${data.districtName.toUpperCase().replace('KECAMATAN ', '')}`, pageWidth / 2, 26, { align: 'center' });

  doc.setFontSize(16);
  doc.text(`KANTOR KEPALA DESA ${data.villageName.toUpperCase().replace('DESA ', '')}`, pageWidth / 2, 33, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text(
    `${data.villageAddress} | Telp: ${data.villagePhone} | Kode Pos: ${DESA.kodePos}`,
    pageWidth / 2,
    38,
    { align: 'center' }
  );

  // Double horizontal separator line (Official Kop standard)
  doc.setLineWidth(0.8);
  doc.line(margin, 42, pageWidth - margin, 42);
  doc.setLineWidth(0.2);
  doc.line(margin, 43.2, pageWidth - margin, 43.2);

  // 2. JUDUL DAN NOMOR SURAT
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('SURAT KETERANGAN TIDAK MAMPU', pageWidth / 2, 53, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 45, 54.5, pageWidth / 2 + 45, 54.5);

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(`Nomor: ${data.documentNumber}`, pageWidth / 2, 60, { align: 'center' });

  // 3. KALIMAT PEMBUKA
  let currentY = 72;
  doc.text(
    `Yang bertanda tangan di bawah ini, Kepala ${data.villageName} ${data.districtName} ${data.regencyName},`,
    margin,
    currentY
  );
  currentY += 6;
  doc.text('menerangkan dengan sesungguhnya bahwa:', margin, currentY);

  // 4. DATA PEMOHON
  currentY += 8;
  const labelX = margin + 8;
  const lineHeight = 6.5;

  const applicantFields = [
    { label: 'Nama Lengkap', value: data.applicantName },
    { label: 'Nomor Induk Kependudukan (NIK)', value: data.nik },
    { label: 'Nomor Kartu Keluarga (KK)', value: data.noKk },
    { label: 'Tempat / Tanggal Lahir', value: `${data.birthPlace}, ${data.birthDate}` },
    { label: 'Jenis Kelamin', value: data.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan' },
    { label: 'Pekerjaan', value: data.occupation },
    { label: 'Alamat / Tempat Tinggal', value: data.address },
  ];

  // Kolon & nilai mulai setelah label terlebar supaya label panjang
  // seperti "Nomor Induk Kependudukan (NIK)" tidak menabrak nilainya.
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const widestLabelWidth = Math.max(...applicantFields.map((f) => doc.getTextWidth(f.label)));
  const colonX = labelX + widestLabelWidth + 2;
  const valueX = colonX + 4;

  for (const item of applicantFields) {
    doc.text(item.label, labelX, currentY);
    doc.text(':', colonX, currentY);
    doc.setFont('times', item.label.includes('Nama') || item.label.includes('NIK') ? 'bold' : 'normal');
    const valueLines = doc.splitTextToSize(item.value, pageWidth - margin - valueX);
    doc.text(valueLines, valueX, currentY);
    doc.setFont('times', 'normal');
    currentY += valueLines.length * lineHeight;
  }

  // 5. ISI PERNYATAAN RESMI
  currentY += 4;
  const statement1 =
    `Orang tersebut di atas adalah benar penduduk yang berdomisili di ${data.villageName} ${data.districtName} ${data.regencyName}. Berdasarkan pendataan dan verifikasi faktual lapangan, yang bersangkutan benar tergolong dalam keluarga TIDAK MAMPU / EKONOMI LEMAH.`;

  const splitStatement1 = doc.splitTextToSize(statement1, pageWidth - margin * 2);
  doc.text(splitStatement1, margin, currentY);
  currentY += splitStatement1.length * 6 + 4;

  const purposeText = `Surat Keterangan Tidak Mampu ini dibuat dan diberikan untuk keperluan: ${data.purposeCategory.toUpperCase()} (${data.purposeDescription}).`;
  const splitPurpose = doc.splitTextToSize(purposeText, pageWidth - margin * 2);
  doc.text(splitPurpose, margin, currentY);
  currentY += splitPurpose.length * 6 + 4;

  const closingText =
    'Demikian Surat Keterangan ini kami buat dengan sebenarnya dan agar dapat dipergunakan sebagaimana mestinya.';
  doc.text(closingText, margin, currentY);

  // 6. TANDA TANGAN & QR CODE VERIFIKASI RESMI
  currentY += 16;

  // Generate QR Code data URL
  const qrCodeDataUrl = await QRCode.toDataURL(data.verificationUrl, {
    margin: 1,
    width: 250,
  });

  // Left column: QR Code verification box (diperlebar agar teks tidak keluar kotak)
  doc.setFontSize(9);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(margin, currentY, 92, 45, 2, 2);
  doc.addImage(qrCodeDataUrl, 'PNG', margin + 3, currentY + 4, 32, 32);

  const qrTextX = margin + 39;
  const qrTextWidth = 50;
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.text(doc.splitTextToSize('Verifikasi Dokumen Resmi', qrTextWidth), qrTextX, currentY + 12);
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text(doc.splitTextToSize('Pindai QR ini atau cek di:', qrTextWidth), qrTextX, currentY + 20);
  doc.setTextColor(30, 64, 175);
  doc.text('desasmart.desa.id', qrTextX, currentY + 26);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.5);
  doc.text(doc.splitTextToSize('Keaslian dokumen terjamin sistem', qrTextWidth), qrTextX, currentY + 38);

  // Right column: Kepala Desa Signature Box
  const signX = pageWidth - margin - 65;
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.text(`${data.villageName.replace(/^Desa\s+/i, '')}, ${data.issuedDate}`, signX, currentY);
  doc.text(`Kepala ${data.villageName},`, signX, currentY + 6);

  // Area tanda tangan & stempel placeholder resmi
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('(Telah diverifikasi & disetujui secara sah)', signX, currentY + 22);
  doc.setTextColor(0, 0, 0);

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text(data.headVillageName, signX, currentY + 34);
  doc.setLineWidth(0.3);
  doc.line(signX, currentY + 35, signX + 55, currentY + 35);

  if (data.headVillageNip) {
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(`NIP. ${data.headVillageNip}`, signX, currentY + 40);
  }

  // Footer security note
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'Dokumen ini dicetak otomatis melalui Sistem Pelayanan Desa Berbasis Web. Keabsahan data dapat diverifikasi secara publik.',
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}
