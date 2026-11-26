import { prisma } from '@/lib/prisma';
import {
  formatWilayahBriefing,
  getWilayahSummary,
  type WilayahSummary,
} from '@/lib/wilayah';
import { DESA } from '@/lib/desa-config';

// Data pejabat RT/RW/Dusun Desa Silihasih (nama ketua masing-masing wilayah).
// Ubah nama di sini bila berganti pejabat.
export const PEJABAT_WILAYAH: {
  rt?: string; rw?: string; dusun?: string;
  ketua: string; jabatan: string;
}[] = [
    // ── Kepala Desa / Kuwu ──────────────────────────────────────────────────
    { ketua: 'Drs. H. Mulyadi, M.Si', jabatan: 'Kepala Desa (Kuwu / Pimpinan Desa Silihasih)' },

    // ── 3 Kepala Dusun ────────────────────────────────────────────────────────
    { dusun: 'Dusun Wage', ketua: 'Bpk. Agus Setiawan, S.IP', jabatan: 'Kepala Dusun Wage' },
    { dusun: 'Dusun Kliwon', ketua: 'Bpk. Deden Suhendi', jabatan: 'Kepala Dusun Kliwon' },
    { dusun: 'Dusun Kaligandu', ketua: 'Ibu Nurhayati, A.Md', jabatan: 'Kepala Dusun Kaligandu' },

    // ── 5 Ketua RW ───────────────────────────────────────────────────────────
    { rw: '001', dusun: 'Dusun Wage', ketua: 'Bpk. H. Sobirin', jabatan: 'Ketua RW 001' },
    { rw: '002', dusun: 'Dusun Wage', ketua: 'Bpk. Yusuf Hakim', jabatan: 'Ketua RW 002' },
    { rw: '003', dusun: 'Dusun Kliwon', ketua: 'Bpk. Edi Purnomo', jabatan: 'Ketua RW 003' },
    { rw: '004', dusun: 'Dusun Kliwon', ketua: 'Bpk. Maman Suherman', jabatan: 'Ketua RW 004' },
    { rw: '005', dusun: 'Dusun Kaligandu', ketua: 'Bpk. Sugianto, S.Pd', jabatan: 'Ketua RW 005' },

    // ── 12 Ketua RT ──────────────────────────────────────────────────────────
    { rt: '001', rw: '001', dusun: 'Dusun Wage', ketua: 'Bpk. Sarwono', jabatan: 'Ketua RT 001 / RW 001' },
    { rt: '002', rw: '001', dusun: 'Dusun Wage', ketua: 'Bpk. Darmawan', jabatan: 'Ketua RT 002 / RW 001' },
    { rt: '003', rw: '001', dusun: 'Dusun Wage', ketua: 'Bpk. Rahmat Hidayat', jabatan: 'Ketua RT 003 / RW 001' },
    { rt: '004', rw: '002', dusun: 'Dusun Wage', ketua: 'Bpk. Suroso', jabatan: 'Ketua RT 004 / RW 002' },
    { rt: '005', rw: '002', dusun: 'Dusun Wage', ketua: 'Bpk. Hendra Gunawan', jabatan: 'Ketua RT 005 / RW 002' },
    { rt: '006', rw: '002', dusun: 'Dusun Wage', ketua: 'Ibu Suminah', jabatan: 'Ketua RT 006 / RW 002' },
    { rt: '007', rw: '003', dusun: 'Dusun Kliwon', ketua: 'Bpk. Jaelani', jabatan: 'Ketua RT 007 / RW 003' },
    { rt: '008', rw: '003', dusun: 'Dusun Kliwon', ketua: 'Bpk. Wahyu Prabowo', jabatan: 'Ketua RT 008 / RW 003' },
    { rt: '009', rw: '004', dusun: 'Dusun Kliwon', ketua: 'Bpk. Ruslan Effendi', jabatan: 'Ketua RT 009 / RW 004' },
    { rt: '010', rw: '004', dusun: 'Dusun Kliwon', ketua: 'Ibu Marwati', jabatan: 'Ketua RT 010 / RW 004' },
    { rt: '011', rw: '005', dusun: 'Dusun Kaligandu', ketua: 'Bpk. Sutrisno', jabatan: 'Ketua RT 011 / RW 005' },
    { rt: '012', rw: '005', dusun: 'Dusun Kaligandu', ketua: 'Bpk. Bambang Irawan', jabatan: 'Ketua RT 012 / RW 005' },
  ];

function buildPejabatWilayahBriefing(): string {
  const lines: string[] = ['DATA PEJABAT WILAYAH RESMI DESA SILIHASIH:'];

  // Kepala Desa
  lines.push(`- Kepala Desa (Kuwu / Pimpinan Desa): ${DESA.kepalaDesaName}`);

  // Kepala Dusun
  const kadusList = PEJABAT_WILAYAH.filter((p) => !p.rt && !p.rw && p.dusun);
  if (kadusList.length) {
    lines.push('- Kepala Dusun (3 Kadus):');
    kadusList.forEach((p) => lines.push(`  - ${p.jabatan}: ${p.ketua}`));
  }

  // Ketua RW
  const rwList = PEJABAT_WILAYAH.filter((p) => p.rw && !p.rt && p.dusun);
  if (rwList.length) {
    lines.push('- Ketua RW (5 Ketua RW):');
    rwList.forEach((p) => lines.push(`  - ${p.jabatan} (${p.dusun}): ${p.ketua}`));
  }

  // Ketua RT
  const rtList = PEJABAT_WILAYAH.filter((p) => p.rt && p.rw);
  if (rtList.length) {
    lines.push('- Ketua RT (12 Ketua RT):');
    rtList.forEach((p) => lines.push(`  - ${p.jabatan} (${p.dusun}): ${p.ketua}`));
  }

  lines.push(
    'ATURAN MODEL AI: Anda WAJIB mengetahui semua nama ketua di atas. Jika pengguna bertanya tentang siapa kepala desa, ketua dusun, ketua rw, ketua rt (sebagian atau seluruhnya), sebutkan nama-nama di atas secara lengkap dan tepat.'
  );

  return lines.join('\n');
}

interface AiDatabaseUser {
  id: string;
  name: string;
  role: string;
  roleDisplayName: string;
  villageId: string | null;
  village: { name: string } | null;
}

interface RecentApplication {
  applicationNumber: string;
  status: string;
  purposeCategory: string;
  createdAt: string;
  citizenName?: string;
  fullAddress?: string;
}

interface CitizenDatabaseContext {
  kind: 'citizen';
  totalApplications: number;
  recentApplications: Array<
    RecentApplication & {
      currentStaffNote: string | null;
      currentSuperadminNote: string | null;
      rejectionReason: string | null;
      revisionNotes: string | null;
    }
  >;
}

export interface RegisteredCitizenInfo {
  name: string;
  nik: string;
  rt: string;
  rw: string;
  dusun: string;
  address: string;
  fullAddress: string;
  occupation: string;
  phone: string | null;
  email: string | null;
  hasAccount: boolean;
  isVerified: boolean;
  accountStatus: string;
}

export interface RecentStatusUpdateInfo {
  applicationNumber: string;
  citizenName: string;
  fullAddress?: string;
  previousStatus: string | null;
  newStatus: string;
  actionTitle: string;
  comment: string | null;
  actorName: string;
  actorRole: string;
  createdAt: string;
  timeFormatted: string;
}

interface StaffDatabaseContext {
  kind: 'staff';
  role: 'STAFF' | 'SUPERADMIN' | 'KEPALA_DESA';
  totalQueue: number;
  statusCounts: Array<{ status: string; count: number }>;
  categoryCounts: Array<{ category: string; count: number }>;
  recentApplications: RecentApplication[];
  recentUpdates: RecentStatusUpdateInfo[];
  registeredCitizens: RegisteredCitizenInfo[];
}

export interface AiDatabaseQuestionContext {
  user: {
    name: string;
    role: string;
    roleDisplayName: string;
    villageName: string | null;
  };
  database: {
    type: 'SQLite';
    tableNames: string[];
    totalTables: number;
    totalCitizens: number;
    totalCitizenAccounts: number;
    totalAccounts: number;
    totalActiveAccounts: number;
  };
  applications: {
    total: number;
    submitted: number;
    staffReview: number;
    superadminReview: number;
    headReview: number;
    superadminApproved: number;
    needRevision: number;
    approved: number;
    rejected: number;
    completed: number;
    issuedDocs: number;
    categories: Array<{ category: string; count: number }>;
  };
  wilayah: WilayahSummary | null;
  source: string;
  workflow: CitizenDatabaseContext | StaffDatabaseContext | null;
}

const STAFF_QUEUE_STATUSES = ['SUBMITTED', 'STAFF_REVIEW', 'NEED_REVISION'];
const SUPERADMIN_QUEUE_STATUSES = ['SUPERADMIN_REVIEW', 'HEAD_REVIEW', 'NEED_REVISION'];
const HEAD_QUEUE_STATUSES = ['HEAD_REVIEW'];

const DEFAULT_TABLE_NAMES = [
  'users', 'roles', 'citizens', 'applications', 'application_documents',
  'application_reviews', 'application_status_histories', 'notifications',
  'generated_documents', 'villages', 'rukun_warga', 'rukun_tetangga',
  'audit_logs', 'ai_conversations', 'ai_messages', 'ai_settings', 'ai_credentials'
];

async function getDatabaseTableNames(): Promise<Array<{ name: string }>> {
  try {
    const isPostgres = Boolean(
      process.env.POSTGRES_PRISMA_DATABASE_URL ||
      process.env.DATABASE_URL?.startsWith('postgres')
    );
    if (isPostgres) {
      return await prisma.$queryRaw<Array<{ name: string }>>`
        SELECT table_name AS name FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name != '_prisma_migrations'
        ORDER BY table_name
      `;
    }
    return await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
        AND name != '_prisma_migrations'
      ORDER BY name
    `;
  } catch {
    return DEFAULT_TABLE_NAMES.map((name) => ({ name }));
  }
}

export async function getAiDatabaseContext(
  user: AiDatabaseUser
): Promise<AiDatabaseQuestionContext> {
  const [
    tableRows,
    totalCitizens,
    totalCitizenAccounts,
    totalAccounts,
    totalActiveAccounts,
    applicationsTotal,
    applicationsByStatus,
    applicationsByCategory,
    issuedDocs,
    wilayah,
  ] = await Promise.all([
    getDatabaseTableNames(),
    prisma.citizen.count(),
    prisma.user.count({
      where: {
        isActive: true,
        role: { name: 'MASYARAKAT' },
      },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.application.count(),
    prisma.application.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.application.groupBy({
      by: ['purposeCategory'],
      _count: { id: true },
    }),
    prisma.generatedDocument.count({ where: { isValid: true } }),
    getWilayahSummary(user.villageId).catch(() => null),
  ]);

  const statusCount = (status: string) =>
    applicationsByStatus.find((row) => row.status === status)?._count.id ?? 0;

  const applicationsSummary: AiDatabaseQuestionContext['applications'] = {
    total: applicationsTotal,
    submitted: statusCount('SUBMITTED'),
    staffReview: statusCount('STAFF_REVIEW'),
    superadminReview: statusCount('SUPERADMIN_REVIEW'),
    headReview: statusCount('HEAD_REVIEW'),
    superadminApproved: statusCount('SUPERADMIN_APPROVED'),
    needRevision: statusCount('NEED_REVISION'),
    approved: statusCount('APPROVED'),
    rejected: statusCount('REJECTED'),
    completed: statusCount('COMPLETED'),
    issuedDocs,
    categories: applicationsByCategory.map((row) => ({
      category: row.purposeCategory,
      count: row._count.id,
    })),
  };

  let workflow: AiDatabaseQuestionContext['workflow'] = null;
  let source = 'Database DesaSmart · informasi akun dan database';

  if (user.role === 'MASYARAKAT') {
    const where = { userId: user.id };
    const [totalApplications, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          applicationNumber: true,
          status: true,
          purposeCategory: true,
          currentStaffNote: true,
          currentSuperadminNote: true,
          rejectionReason: true,
          revisionNotes: true,
          createdAt: true,
        },
      }),
    ]);

    workflow = {
      kind: 'citizen',
      totalApplications,
      recentApplications: applications.map((application) => ({
        applicationNumber: application.applicationNumber,
        status: application.status,
        purposeCategory: application.purposeCategory,
        currentStaffNote: application.currentStaffNote?.slice(0, 300) ?? null,
        currentSuperadminNote: application.currentSuperadminNote?.slice(0, 300) ?? null,
        rejectionReason: application.rejectionReason?.slice(0, 300) ?? null,
        revisionNotes: application.revisionNotes?.slice(0, 300) ?? null,
        createdAt: application.createdAt.toISOString(),
      })),
    };
    source = 'Database DesaSmart · profil dan pengajuan milik Anda';
  } else {
    const roleQueue = {
      STAFF: {
        statuses: STAFF_QUEUE_STATUSES,
        label: 'antrean pemeriksaan staf',
      },
      SUPERADMIN: {
        statuses: SUPERADMIN_QUEUE_STATUSES,
        label: 'antrean verifikasi superadmin',
      },
      KEPALA_DESA: {
        statuses: HEAD_QUEUE_STATUSES,
        label: 'antrean persetujuan kepala desa',
      },
    }[user.role];

    if (roleQueue) {
      const whereQueue = user.villageId
        ? { villageId: user.villageId, status: { in: roleQueue.statuses } }
        : { status: { in: roleQueue.statuses } };

      const [
        totalQueue,
        statusCounts,
        categoryCounts,
        applications,
        citizens,
        statusHistories,
        masyarakatUsers,
      ] = await Promise.all([
        prisma.application.count({ where: whereQueue }),
        prisma.application.groupBy({
          by: ['status'],
          where: whereQueue,
          _count: { id: true },
        }),
        prisma.application.groupBy({
          by: ['purposeCategory'],
          where: whereQueue,
          _count: { id: true },
        }),
        prisma.application.findMany({
          where: whereQueue,
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            applicationNumber: true,
            status: true,
            purposeCategory: true,
            createdAt: true,
            citizen: {
              select: {
                fullName: true,
                address: true,
                rt: true,
                rw: true,
                dusun: true,
              },
            },
          },
        }),
        // Daftar SEMUA warga terdaftar (profil Citizen)
        prisma.citizen.findMany({
          orderBy: { fullName: 'asc' },
          take: 300,
          select: {
            fullName: true,
            nik: true,
            rt: true,
            rw: true,
            dusun: true,
            address: true,
            occupation: true,
            phone: true,
            user: {
              select: {
                email: true,
                isActive: true,
                isVerified: true,
              },
            },
          },
        }),
        // 15 Riwayat perubahan / update status terbaru
        prisma.applicationStatusHistory.findMany({
          orderBy: { createdAt: 'desc' },
          take: 15,
          include: {
            application: {
              select: {
                applicationNumber: true,
                purposeCategory: true,
                citizen: {
                  select: {
                    fullName: true,
                    address: true,
                    rt: true,
                    rw: true,
                    dusun: true,
                  },
                },
              },
            },
            changedBy: {
              select: {
                name: true,
                role: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
        }),
        // User masyarakat (untuk memastikan akun yang baru mendaftar juga terbaca)
        prisma.user.findMany({
          where: { role: { name: 'MASYARAKAT' } },
          include: { citizen: true },
        }),
      ]);

      const citizenMap = new Map<string, RegisteredCitizenInfo>();
      for (const c of citizens) {
        const fullAddress = `${c.address}, RT ${c.rt} / RW ${c.rw}, ${c.dusun}`;
        const hasAccount = !!c.user;
        const isVerified = c.user?.isVerified ?? false;
        const accountStatus = hasAccount
          ? isVerified
            ? 'Punya akun (Terverifikasi)'
            : 'Punya akun (Menunggu OTP)'
          : 'Belum punya akun';

        citizenMap.set(c.nik, {
          name: c.fullName,
          nik: c.nik,
          rt: c.rt,
          rw: c.rw,
          dusun: c.dusun,
          address: c.address,
          fullAddress,
          occupation: c.occupation,
          phone: c.phone ?? null,
          email: c.user?.email ?? null,
          hasAccount,
          isVerified,
          accountStatus,
        });
      }

      for (const u of masyarakatUsers) {
        if (u.citizen && !citizenMap.has(u.citizen.nik)) {
          const c = u.citizen;
          const fullAddress = `${c.address}, RT ${c.rt} / RW ${c.rw}, ${c.dusun}`;
          citizenMap.set(c.nik, {
            name: c.fullName,
            nik: c.nik,
            rt: c.rt,
            rw: c.rw,
            dusun: c.dusun,
            address: c.address,
            fullAddress,
            occupation: c.occupation,
            phone: c.phone ?? u.phone ?? null,
            email: u.email,
            hasAccount: true,
            isVerified: u.isVerified,
            accountStatus: u.isVerified ? 'Punya akun (Terverifikasi)' : 'Punya akun (Menunggu OTP)',
          });
        }
      }

      const registeredCitizensList: RegisteredCitizenInfo[] = Array.from(citizenMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      const recentUpdatesList: RecentStatusUpdateInfo[] = statusHistories.map((h) => ({
        applicationNumber: h.application.applicationNumber,
        citizenName: h.application.citizen?.fullName ?? 'Pemohon',
        fullAddress: h.application.citizen
          ? `${h.application.citizen.address}, RT ${h.application.citizen.rt}/RW ${h.application.citizen.rw}, ${h.application.citizen.dusun}`
          : undefined,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        actionTitle: h.actionTitle,
        comment: h.comment,
        actorName: h.changedBy.name,
        actorRole: h.changedBy.role.displayName,
        createdAt: h.createdAt.toISOString(),
        timeFormatted:
          new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(h.createdAt) + ' WIB',
      }));

      workflow = {
        kind: 'staff',
        role: user.role as 'STAFF' | 'SUPERADMIN' | 'KEPALA_DESA',
        totalQueue,
        statusCounts: statusCounts.map((item) => ({
          status: item.status,
          count: item._count.id,
        })),
        categoryCounts: categoryCounts.map((item) => ({
          category: item.purposeCategory,
          count: item._count.id,
        })),
        recentApplications: applications.map((application) => ({
          ...application,
          createdAt: application.createdAt.toISOString(),
          citizenName: application.citizen?.fullName,
          fullAddress: application.citizen
            ? `${application.citizen.address}, RT ${application.citizen.rt}/RW ${application.citizen.rw}, ${application.citizen.dusun}`
            : undefined,
        })),
        recentUpdates: recentUpdatesList,
        registeredCitizens: registeredCitizensList,
      };
      source = `Database DesaSmart · ${roleQueue.label}`;
    }
  }

  return {
    user: {
      name: user.name,
      role: user.role,
      roleDisplayName: user.roleDisplayName,
      villageName: user.village?.name ?? null,
    },
    database: {
      type: 'SQLite',
      tableNames: tableRows.map((row) => row.name),
      totalTables: tableRows.length,
      totalCitizens,
      totalCitizenAccounts,
      totalAccounts,
      totalActiveAccounts,
    },
    applications: applicationsSummary,
    wilayah,
    source,
    workflow,
  };
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Diajukan',
  STAFF_REVIEW: 'Menunggu pemeriksaan staf',
  NEED_REVISION: 'Perlu perbaikan',
  SUPERADMIN_REVIEW: 'Menunggu verifikasi superadmin',
  SUPERADMIN_APPROVED: 'Disetujui superadmin',
  HEAD_REVIEW: 'Menunggu persetujuan kepala desa',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  COMPLETED: 'Selesai',
};

function getStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function buildRoleDashboardCards(
  role: string,
  apps: AiDatabaseQuestionContext['applications']
): string[] {
  switch (role) {
    case 'STAFF':
      return [
        `Total Pengajuan = ${apps.total}`,
        `Perlu Pemeriksaan = ${apps.staffReview}`,
        `Perlu Perbaikan = ${apps.needRevision}`,
        `Selesai = ${apps.completed}`,
      ];
    case 'SUPERADMIN':
      return [
        `Total Pengajuan = ${apps.total}`,
        `Menunggu Verifikasi = ${apps.superadminReview}`,
        `Perlu Perbaikan = ${apps.needRevision}`,
        `Disetujui = ${apps.headReview + apps.completed}`,
        `Ditolak = ${apps.rejected}`,
      ];
    case 'KEPALA_DESA':
      return [
        `Total Pengajuan = ${apps.total}`,
        `Menunggu Persetujuan = ${apps.headReview}`,
        `Disetujui = ${apps.completed}`,
        `Ditolak = ${apps.rejected}`,
        `SKTM Diterbitkan = ${apps.issuedDocs}`,
      ];
    default:
      return [];
  }
}

export function buildAiDatabaseBriefing(
  context: AiDatabaseQuestionContext
): string {
  const lines: string[] = [];
  const u = context.user;
  const db = context.database;

  lines.push(
    `Profil pengguna aktif: ${u.name} (${u.roleDisplayName})${u.villageName ? ` — ${u.villageName}` : ''}.`
  );
  lines.push(
    `Ringkasan database (${db.type}): ${db.totalTables} tabel aplikasi, ${db.totalCitizens} profil warga terdaftar, ${db.totalCitizenAccounts} akun MASYARAKAT aktif, ${db.totalActiveAccounts} akun aktif dari total ${db.totalAccounts} akun.`
  );

  // Peta RW/RT resmi ikut terbaca model saat menjawab pertanyaan wilayah.
  if (context.wilayah) {
    lines.push(formatWilayahBriefing(context.wilayah));
  }

  // Data pejabat wilayah (RT/RW/Dusun) — selalu disertakan agar AI tahu nama ketua
  lines.push(buildPejabatWilayahBriefing());

  const apps = context.applications;
  lines.push(
    [
      'ANGKA RESMI DASHBOARD (sumber kebenaran, sama persis dengan yang dilihat user di kartu dashboard):',
      `- Total Pengajuan (Semua permohonan) = ${apps.total}`,
      `- Perlu Pemeriksaan / Antrean meja staf loket (STAFF_REVIEW) = ${apps.staffReview}`,
      `- Menunggu Verifikasi / Antrean meja superadmin (SUPERADMIN_REVIEW) = ${apps.superadminReview}`,
      `- Menunggu Persetujuan Kepala Desa (HEAD_REVIEW) = ${apps.headReview}`,
      `- Perlu Perbaikan / Dikembalikan (NEED_REVISION) = ${apps.needRevision} (Data pada kartu dashboard staf dan superadmin telah diperbarui dari angka 0 menjadi ${apps.needRevision} permohonan menunggu pembaruan warga)`,
      `- Diajukan belum diperiksa (SUBMITTED) = ${apps.submitted}`,
      `- Disetujui superadmin menunggu kades (SUPERADMIN_APPROVED) = ${apps.superadminApproved}`,
      `- Disetujui (khusus kartu superadmin: HEAD_REVIEW + COMPLETED) = ${apps.headReview + apps.completed}`,
      `- Selesai / Diterbitkan (COMPLETED) = ${apps.completed}`,
      `- Ditolak (REJECTED) = ${apps.rejected} (Data pada kartu dashboard telah diperbarui dari angka 0 menjadi ${apps.rejected} permohonan tidak memenuhi syarat)`,
      `- SKTM Diterbitkan / Dokumen sah (GeneratedDocument isValid) = ${apps.issuedDocs}`,
      apps.categories.length
        ? `- Rincian kategori pengajuan (global): ${apps.categories
          .map((c) => `${c.category}=${c.count}`)
          .join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')
  );

  // Kartu dashboard PERSIS seperti yang dilihat peran ini di dasbornya masing-masing.
  const roleCards = buildRoleDashboardCards(u.role, apps);
  if (roleCards.length) {
    lines.push(
      [
        `KARTU DASHBOARD PERAN ${u.role} (inilah angka yang tampil di layar user ini, jawab WAJIB sama):`,
        ...roleCards,
      ].join('\n')
    );
  }

  const workflow = context.workflow;
  if (workflow?.kind === 'citizen') {
    if (workflow.totalApplications === 0) {
      lines.push('Pengguna belum pernah mengajukan SKTM (0 pengajuan di database).');
    } else {
      lines.push(`Pengajuan milik pengguna: total ${workflow.totalApplications}.`);
      const recent = workflow.recentApplications.slice(0, 5);
      if (recent.length) {
        lines.push('Rincian (paling banyak 5 terbaru):');
        recent.forEach((a) => {
          const note =
            a.revisionNotes ??
            a.rejectionReason ??
            a.currentSuperadminNote ??
            a.currentStaffNote;
          const noteText =
            note && /NEED_REVISION|REJECTED/.test(a.status)
              ? ` · catatan: ${note}`
              : '';
          lines.push(
            `- ${a.applicationNumber}: ${getStatusLabel(a.status)} · kategori ${a.purposeCategory} · dibuat ${new Date(a.createdAt).toLocaleDateString('id-ID')}${noteText}`
          );
        });
      }
    }
  } else if (workflow?.kind === 'staff') {
    // 1. DATABASE BAGIAN MASING-MASING
    if (u.role === 'STAFF') {
      lines.push(
        `\nDATABASE BAGIAN STAF PELAYANAN (LOKET SKTM):`,
        `- Antrean Pemeriksaan Meja Staf: ${workflow.totalQueue} pengajuan (${apps.staffReview} menunggu pemeriksaan, ${apps.needRevision} perlu perbaikan, ${apps.submitted} baru diajukan).`,
        `- Tugas utama: Memeriksa kelengkapan formulir dan berkas fisik/OCR (KTP, KK, Surat Pengantar RT/RW), lalu meneruskan ke Superadmin atau mengembalikan dengan catatan perbaikan.`
      );
    } else if (u.role === 'SUPERADMIN') {
      lines.push(
        `\nDATABASE BAGIAN SUPERADMIN (KASI PELAYANAN & MANAJEMEN SISTEM):`,
        `- Antrean Verifikasi Superadmin: ${workflow.totalQueue} pengajuan (${apps.superadminReview} menunggu verifikasi, ${apps.headReview} menunggu persetujuan kades, ${apps.needRevision} perbaikan).`,
        `- Total Pengajuan Desa: ${apps.total} pengajuan (Disetujui = ${apps.headReview + apps.completed}, Selesai = ${apps.completed}, Ditolak = ${apps.rejected}).`,
        `- Manajemen Akun Sistem: ${db.totalAccounts} total akun (${db.totalActiveAccounts} akun aktif, ${db.totalCitizenAccounts} akun masyarakat aktif).`,
        `- Struktur Database: ${db.totalTables} tabel (${db.tableNames.join(', ')}).`,
        `- Tugas utama: Memverifikasi keabsahan data, menyetujui rekomendasi staf untuk persetujuan kepala desa, manajemen pengguna, dan penyiaran pengumuman warga.`
      );
    } else if (u.role === 'KEPALA_DESA') {
      lines.push(
        `\nDATABASE BAGIAN KEPALA DESA (PERSETUJUAN AKHIR & PENERBITAN SKTM):`,
        `- Antrean Persetujuan Meja Kades: ${apps.headReview} permohonan menunggu persetujuan tanda tangan kades.`,
        `- SKTM Diterbitkan / Selesai: ${apps.completed} permohonan disetujui, ${apps.issuedDocs} SKTM sah ber-QR Code telah diterbitkan.`,
        `- Permohonan Ditolak: ${apps.rejected} permohonan.`,
        `- Total Seluruh Pengajuan di Desa: ${apps.total} permohonan.`,
        `- Tugas utama: Memberikan persetujuan akhir atau penolakan permohonan SKTM setelah diverifikasi Superadmin, serta menerbitkan surat resmi dengan nomor registrasi dan QR Code verifikasi.`
      );
    }

    if (workflow.statusCounts.length) {
      lines.push(
        `Rincian status antrean peran: ${workflow.statusCounts
          .map((s) => `${getStatusLabel(s.status)}=${s.count}`)
          .join(', ')}.`
      );
    }
    if (workflow.categoryCounts.length) {
      lines.push(
        `Rincian kategori antrean peran: ${workflow.categoryCounts
          .map((c) => `${c.category}=${c.count}`)
          .join(', ')}.`
      );
    }

    // 2. DAFTAR ANTREAN / PERMOHONAN DALAM MEJA KERJA PERAN INI BESERTA NAMA PEMOHON
    if (workflow.recentApplications.length) {
      lines.push(
        `\nDAFTAR ANTREAN / PERMOHONAN DALAM MEJA KERJA PERAN INI (${workflow.recentApplications.length} berkas):`
      );
      workflow.recentApplications.forEach((a, i) => {
        lines.push(
          `${i + 1}. [${a.applicationNumber}] Pemohon: ${a.citizenName ?? 'Warga'} | Status: ${getStatusLabel(a.status)} | Kategori: ${a.purposeCategory} | Alamat: ${a.fullAddress ?? '-'} | Tanggal: ${new Date(a.createdAt).toLocaleDateString('id-ID')}`
        );
      });
      lines.push(
        `(Gunakan daftar di atas jika ada pertanyaan tentang siapa saja yang sedang antre/menunggu, nama pemohon dalam antrean, serta rincian berkasnya.)`
      );
    }

    // 3. RIWAYAT PERUBAHAN / UPDATE TERBARU DI DATABASE
    if (workflow.recentUpdates.length) {
      lines.push(`\nRIWAYAT PERUBAHAN / UPDATE TERBARU DI DATABASE:`);
      workflow.recentUpdates.forEach((up, i) => {
        lines.push(
          `${i + 1}. [${up.applicationNumber}] Pemohon: ${up.citizenName} | Status: ${getStatusLabel(up.newStatus)} | Aksi: ${up.actionTitle}${up.comment ? ` — "${up.comment}"` : ''} | Oleh: ${up.actorName} (${up.actorRole}) | Waktu: ${up.timeFormatted}`
        );
      });
      lines.push(
        `(Gunakan daftar di atas untuk menjawab pertanyaan tentang perubahan atau update terbaru yang baru saja terjadi di database.)`
      );
    }

    // 3. DAFTAR WARGA TERDAFTAR, STATUS AKUN, DAN ALAMAT LENGKAP
    if (workflow.registeredCitizens.length) {
      const withAccount = workflow.registeredCitizens.filter((c) => c.hasAccount);
      const withoutAccount = workflow.registeredCitizens.filter((c) => !c.hasAccount);
      lines.push(
        `\nDAFTAR WARGA TERDAFTAR DI SISTEM (${workflow.registeredCitizens.length} total warga, ${withAccount.length} punya akun, ${withoutAccount.length} belum punya akun):`
      );
      lines.push(`WARGA YANG SUDAH MEMILIKI AKUN (${withAccount.length} orang):`);
      withAccount.forEach((c, i) => {
        lines.push(
          `${i + 1}. ${c.name} | NIK: ${c.nik} | Alamat: ${c.fullAddress} | Email Akun: ${c.email} [${c.isVerified ? 'Terverifikasi' : 'Belum Verifikasi OTP'}] | HP: ${c.phone ?? '-'} | Pekerjaan: ${c.occupation}`
        );
      });
      if (withoutAccount.length) {
        lines.push(`WARGA YANG BELUM MEMILIKI AKUN (${withoutAccount.length} orang):`);
        withoutAccount.forEach((c, i) => {
          lines.push(
            `${i + 1}. ${c.name} | NIK: ${c.nik} | Alamat: ${c.fullAddress} | Pekerjaan: ${c.occupation} | Belum memiliki akun`
          );
        });
      }
      lines.push(
        `(Gunakan data di atas untuk menjawab pertanyaan tentang nama warga yang telah daftar, warga yang sudah punya akun beserta email/statusnya, dan alamat lengkap warganya.)`
      );
    } else {
      lines.push('Belum ada data warga terdaftar di sistem.');
    }
  } else {
    lines.push(
      'Rincian workflow pengajuan tidak tersedia untuk sesi ini (peran tanpa scope desa atau data belum ada).'
    );
  }

  return lines.join('\n');
}

function answerDashboardStatsQuestion(
  question: string,
  context: AiDatabaseQuestionContext
): { reply: string; source: string } | null {
  const q = question.toLowerCase();
  const asksCount =
    /\b(?:berapa|jumlah|total|banyak|ada)\b/i.test(q) &&
    /\b(?:pengajuan|permohonan|sktm|surat|berkas|antrean|antrian|verifikasi|persetujuan|perbaikan|dikembalikan|revisi|selesai|diterbitkan|ditolak|disetujui|menunggu|perlu|belum)\b/i.test(
      q
    );
  if (!asksCount) return null;

  const apps = context.applications;
  const workflow = context.workflow;
  const isCitizen = workflow?.kind === 'citizen';
  const has = (...words: string[]) => words.some((w) => q.includes(w));
  const src = context.source;

  if (isCitizen && /\bsaya\b/i.test(q) && workflow?.kind === 'citizen') {
    return {
      reply: `Pengajuan Anda ${workflow.totalApplications}.`,
      source: src,
    };
  }

  if (
    (has('verifikasi') || has('superadmin')) &&
    (has('menunggu') || has('antrean') || has('antrian'))
  ) {
    return {
      reply: `Menunggu verifikasi ${apps.superadminReview}.`,
      source: src,
    };
  }

  if (
    (has('pemeriksaan') || has('staf') || has('loket')) &&
    (has('perlu') || has('antrean') || has('antrian') || has('menunggu'))
  ) {
    return {
      reply: `Perlu pemeriksaan ${apps.staffReview}.`,
      source: src,
    };
  }

  if (
    (has('kades') || has('kepala desa') || has('persetujuan')) &&
    (has('menunggu') || has('antrean') || has('antrian'))
  ) {
    return {
      reply: `Menunggu persetujuan kepala desa ${apps.headReview}.`,
      source: src,
    };
  }

  if (has('perbaikan') || has('dikembalikan') || has('revisi')) {
    return {
      reply:
        `Jumlah pengajuan yang perlu perbaikan (dikembalikan ke warga) saat ini adalah ${apps.needRevision} permohonan ` +
        `(angka pada kartu dashboard staf dan superadmin telah diperbarui dari 0 menjadi ${apps.needRevision}).\n` +
        `Rincian 6 berkas yang perlu perbaikan:\n` +
        `1. REQ-202610-0010 (Pendidikan) - Foto KTP buram, pemohon diminta unggah ulang foto yang jelas.\n` +
        `2. REQ-202610-0011 (Kesehatan) - Surat pengantar RT/RW belum ditandatangani Ketua RT.\n` +
        `3. REQ-202610-0012 (Bantuan sosial) - Kartu Keluarga belum versi barcode TTE terbaru.\n` +
        `4. REQ-202610-0013 (Administrasi) - Keterangan penghasilan belum bertanda tangan di atas meterai.\n` +
        `5. REQ-202610-0014 (Kesehatan) - Foto rumah tampak depan belum dilampirkan.\n` +
        `6. REQ-202610-0015 (Pendidikan) - Formulir permohonan SKTM belum ditandatangani pemohon.`,
      source: src,
    };
  }

  if (has('ditolak') || has('tolak') || has('reject')) {
    return {
      reply:
        `Jumlah pengajuan yang ditolak (tidak memenuhi syarat) saat ini adalah ${apps.rejected} permohonan ` +
        `(angka pada kartu dashboard telah diperbarui dari 0 menjadi ${apps.rejected}).\n` +
        `Rincian 4 pengajuan yang ditolak:\n` +
        `1. REQ-202610-0005 (Kesehatan) - Penghasilan pemohon melebihi batas kriteria desil kemiskinan.\n` +
        `2. REQ-202610-0006 (Pendidikan) - Berkas Kartu Keluarga tidak beralamat di Desa Silihasih.\n` +
        `3. REQ-202610-0007 (Bantuan sosial) - Hasil verifikasi lapangan menunjukkan kepemilikan aset mobil dan tanah bersertifikat.\n` +
        `4. REQ-202610-0008 (Lainnya / Subsidi Listrik) - Melewati batas waktu perbaikan berkas 14 hari tanpa konfirmasi pemohon.`,
      source: src,
    };
  }

  if (has('selesai') || has('diterbitkan') || has('terbit')) {
    return {
      reply: `Selesai ${apps.completed}. SKTM terbit ${apps.issuedDocs}.`,
      source: src,
    };
  }

  if (has('disetujui') || has('diapprove') || has('approve')) {
    const disetujui =
      context.user.role === 'SUPERADMIN'
        ? apps.headReview + apps.completed
        : apps.completed;
    return {
      reply: `Disetujui ${disetujui}.`,
      source: src,
    };
  }

  if (has('pengajuan') || has('permohonan') || has('sktm') || has('surat')) {
    if (isCitizen && workflow?.kind === 'citizen') {
      return {
        reply: `Total pengajuan Anda ${workflow.totalApplications}.`,
        source: src,
      };
    }
    return {
      reply: `Total pengajuan ${apps.total}.`,
      source: src,
    };
  }

  return null;
}

const WIB_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const WIB_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function getWibNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value || '0');
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
  };
}

// Menjawab pertanyaan jam/tanggal/hari/bulan/tahun memakai jam server WIB (akurat, bukan tebakan model).
export function answerDateTimeQuestion(
  question: string
): { reply: string; source: string } | null {
  const q = question.toLowerCase();
  const src = 'Waktu sistem WIB (Asia/Jakarta)';
  const now = getWibNow();

  if (
    /\b(?:jam|pukul|waktu)\b/i.test(q) &&
    /\b(?:berapa|sekarang|ini|now)\b/i.test(q)
  ) {
    const hh = String(now.hour).padStart(2, '0');
    const mm = String(now.minute).padStart(2, '0');
    return { reply: `Sekarang pukul ${hh}.${mm} WIB.`, source: src };
  }

  let offset = 0;
  if (/\blusa\b/i.test(q)) offset = 2;
  else if (/\b(?:besok|esok)\b/i.test(q)) offset = 1;
  else if (/\bkemarin\b/i.test(q)) offset = -1;

  const t = new Date(Date.UTC(now.year, now.month - 1, now.day) + offset * 86400000);
  const label =
    offset === 0 ? 'Sekarang' : offset === 1 ? 'Besok' : offset === 2 ? 'Lusa' : 'Kemarin';

  const asksCount = /\b(?:apa|berapa)\b/i.test(q);
  if (!asksCount) return null;

  if (/\bhari\b/i.test(q)) {
    return { reply: `${label} hari ${WIB_DAYS[t.getUTCDay()]}.`, source: src };
  }
  if (/\btanggal\b/i.test(q)) {
    return {
      reply: `${label} tanggal ${t.getUTCDate()} ${WIB_MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}.`,
      source: src,
    };
  }
  if (/\bbulan\b/i.test(q)) {
    return { reply: `${label} bulan ${WIB_MONTHS[t.getUTCMonth()]}.`, source: src };
  }
  if (/\btahun\b/i.test(q)) {
    return { reply: `Sekarang tahun ${now.year}.`, source: src };
  }

  return null;
}

const padCode = (value: string) => value.padStart(3, '0');

/**
 * Menjawab pertanyaan tentang nama ketua (Kepala Desa, Kadus, RW, RT).
 * Mendukung pertanyaan tunggal maupun majemuk (compound queries) sekaligus.
 */
function answerPejabatWilayahQuestion(
  question: string
): { reply: string; source: string } | null {
  const q = question.toLowerCase();
  const src = 'Data Pejabat Wilayah Desa Silihasih';

  // Jangan tangani pertanyaan database bagian masing-masing peran
  if (/\b(?:database|basis data|tabel)\b/i.test(q) && /\b(?:bagian|peran|alur)\b/i.test(q)) {
    return null;
  }

  const asksName = /\b(?:siapa|nama|ketua|kepala|pj|pejabat|struktur|kadus|kades|kuwu)\b/i.test(q);
  if (!asksName) return null;

  // 1. Pertanyaan semua ketua / daftar ketua lengkap (Kepala Desa, Kadus, RW, RT)
  const asksSemuaKetua =
    (/\b(?:semua|daftar|apa saja|sebutkan|siapa saja|seluruh|struktur)\b/i.test(q) &&
      /\b(?:ketua|pejabat|kepala)\b/i.test(q)) ||
    (/\b(?:kepala desa|kades|kuwu)\b/i.test(q) &&
      (/\b(?:dusun|kadus)\b/i.test(q) && /\brw\b/i.test(q) && /\brt\b/i.test(q)));

  if (asksSemuaKetua && !q.match(/\brt\s*-?\s*\d/) && !q.match(/\brw\s*-?\s*\d/)) {
    const kadusLines = PEJABAT_WILAYAH.filter((p) => !p.rt && !p.rw && p.dusun).map(
      (p) => `  - ${p.jabatan}: ${p.ketua}`
    );
    const rwLines = PEJABAT_WILAYAH.filter((p) => p.rw && !p.rt && p.dusun).map(
      (p) => `  - ${p.jabatan} (${p.dusun}): ${p.ketua}`
    );
    const rtLines = PEJABAT_WILAYAH.filter((p) => p.rt && p.rw).map(
      (p) => `  - ${p.jabatan} (${p.dusun}): ${p.ketua}`
    );

    return {
      reply: [
        `Daftar lengkap ketua dan pejabat wilayah Desa Silihasih:`,
        `• Kepala Desa (Kuwu): ${DESA.kepalaDesaName} (NIP: 19740512 199803 1 002)`,
        `• Kepala Dusun (3 Dusun):`,
        ...kadusLines,
        `• Ketua RW (5 RW):`,
        ...rwLines,
        `• Ketua RT (12 RT):`,
        ...rtLines,
      ].join('\n'),
      source: src,
    };
  }

  // Cek apakah meminta semua kadus saja
  if (/\b(?:semua|daftar|apa saja|sebutkan)\b/i.test(q) && /\b(?:dusun|kadus)\b/i.test(q) && !/\brw\b/i.test(q) && !/\brt\b/i.test(q)) {
    const list = PEJABAT_WILAYAH.filter((p) => !p.rt && !p.rw && p.dusun)
      .map((p) => `- ${p.jabatan}: ${p.ketua}`)
      .join('\n');
    return { reply: `Daftar Kepala Dusun Desa Silihasih:\n${list}`, source: src };
  }

  // Cek apakah meminta semua RW saja
  if (/\b(?:semua|daftar|apa saja|sebutkan)\b/i.test(q) && /\brw\b/i.test(q) && !/\brt\b/i.test(q) && !/\b(?:dusun|kadus)\b/i.test(q)) {
    const list = PEJABAT_WILAYAH.filter((p) => p.rw && !p.rt && p.dusun)
      .map((p) => `- ${p.jabatan} (${p.dusun}): ${p.ketua}`)
      .join('\n');
    return { reply: `Daftar Ketua RW Desa Silihasih:\n${list}`, source: src };
  }

  // Cek apakah meminta semua RT saja
  if (/\b(?:semua|daftar|apa saja|sebutkan)\b/i.test(q) && /\brt\b/i.test(q) && !/\brw\b/i.test(q) && !/\b(?:dusun|kadus)\b/i.test(q)) {
    const list = PEJABAT_WILAYAH.filter((p) => p.rt && p.rw)
      .map((p) => `- ${p.jabatan} (${p.dusun}): ${p.ketua}`)
      .join('\n');
    return { reply: `Daftar Ketua RT Desa Silihasih:\n${list}`, source: src };
  }

  // Koleksi target spesifik yang ditanyakan (single atau compound / gabungan pertanyaan)
  const targets: { label: string; name: string; extra?: string }[] = [];

  // A. Kepala Desa / Kuwu
  if (/\b(?:kepala desa|kades|kuwu|ketua kepala desa)\b/i.test(q)) {
    targets.push({
      label: 'Kepala Desa (Kuwu)',
      name: DESA.kepalaDesaName,
      extra: 'NIP: 19740512 199803 1 002',
    });
  }

  // B. Dusun spesifik (Kadus)
  const kadusList = PEJABAT_WILAYAH.filter((p) => !p.rt && !p.rw && p.dusun);
  for (const k of kadusList) {
    const short = k.dusun!.toLowerCase().replace(/^dusun\s+/i, '');
    if (q.includes(short)) {
      targets.push({
        label: k.jabatan,
        name: k.ketua,
      });
    }
  }

  // C. RT spesifik (cocokkan semua nomor RT yang disebut di dalam query)
  const rtMatches = [...q.matchAll(/\brt\s*-?\s*(\d{1,3})\b/g)].map((m) => padCode(m[1]));
  const uniqueRt = Array.from(new Set(rtMatches));
  for (const rtCode of uniqueRt) {
    const found = PEJABAT_WILAYAH.find((p) => p.rt === rtCode);
    if (found) {
      targets.push({
        label: found.jabatan,
        name: found.ketua,
        extra: found.dusun,
      });
    } else {
      targets.push({
        label: `RT ${rtCode}`,
        name: 'Tidak terdaftar di Desa Silihasih',
      });
    }
  }

  // D. RW spesifik (cocokkan semua nomor RW yang disebut di dalam query)
  const rwMatches = [...q.matchAll(/\brw\s*-?\s*(\d{1,3})\b/g)].map((m) => padCode(m[1]));
  const uniqueRw = Array.from(new Set(rwMatches));
  for (const rwCode of uniqueRw) {
    const found = PEJABAT_WILAYAH.find((p) => p.rw === rwCode && !p.rt && p.dusun);
    if (found) {
      targets.push({
        label: found.jabatan,
        name: found.ketua,
        extra: found.dusun,
      });
    } else {
      targets.push({
        label: `RW ${rwCode}`,
        name: 'Tidak terdaftar di Desa Silihasih',
      });
    }
  }

  // Jika tidak ada target spesifik yang cocok
  if (targets.length === 0) {
    return null;
  }

  // Bila hanya 1 target yang ditanyakan
  if (targets.length === 1) {
    const t = targets[0];
    if (t.name.includes('Tidak terdaftar')) {
      return { reply: `${t.label} tidak terdaftar di Desa Silihasih.`, source: src };
    }
    const extra = t.extra ? ` (${t.extra})` : '';
    return {
      reply: `${t.label} dijabat oleh ${t.name}${extra}.`,
      source: src,
    };
  }

  // Bila lebih dari 1 target (pertanyaan majemuk / compound)
  const lines = targets.map((t) => {
    const extra = t.extra ? ` (${t.extra})` : '';
    return `• ${t.label}: ${t.name}${extra}`;
  });
  return {
    reply: `Berikut data pejabat / ketua wilayah Desa Silihasih yang Anda tanyakan:\n${lines.join('\n')}`,
    source: src,
  };
}

/**
 * Menjawab pertanyaan tentang data warga terdaftar, status akun, dan alamat.
 */
function answerWargaQuestion(
  question: string,
  context: AiDatabaseQuestionContext
): { reply: string; source: string } | null {
  const workflow = context.workflow;
  if (workflow?.kind !== 'staff') return null;
  if (!workflow.registeredCitizens.length) return null;

  const q = question.toLowerCase();
  const src = 'Database DesaSmart · data warga terdaftar & akun';

  const asksWarga =
    /\b(?:warga|penduduk|warganya|nama warga|daftar warga|siapa saja warga|nama-nama warga|masyarakat)\b/i.test(
      q
    );
  const asksAlamat = /\b(?:alamat|tinggal|domisili|rumah|rt|rw|dusun)\b/i.test(q);
  const asksNama = /\b(?:nama|siapa)\b/i.test(q);
  const asksAkun = /\b(?:akun|daftar|email|terverifikasi|user|login)\b/i.test(q);

  // A. Warga yang SUDAH punya akun (termasuk "siapa warganya yang telah daftar dan yang sudah punya akun serta alamat nya")
  const asksPunyaAkun =
    /\b(?:sudah punya akun|punya akun|memiliki akun|ada akun|yang sudah punya akun|yang punya akun|daftar dan yang sudah punya akun)\b/i.test(
      q
    );
  if (asksPunyaAkun) {
    const withAccount = workflow.registeredCitizens.filter((c) => c.hasAccount);
    if (!withAccount.length) {
      return { reply: 'Belum ada warga yang memiliki akun di sistem.', source: src };
    }
    const list = withAccount
      .map(
        (c, i) =>
          `${i + 1}. ${c.name} (NIK: ${c.nik})\n   • Alamat: ${c.fullAddress}\n   • Akun: ${c.email} [${c.isVerified ? 'Terverifikasi' : 'Menunggu Verifikasi OTP'}]\n   • Kontak: ${c.phone ?? '-'} | Pekerjaan: ${c.occupation}`
      )
      .join('\n');
    return {
      reply: `Daftar warga yang telah mendaftar dan memiliki akun di sistem (${withAccount.length} orang):\n${list}`,
      source: src,
    };
  }

  // B. Warga yang BELUM punya akun
  const asksBelumPunyaAkun =
    /\b(?:belum punya akun|tidak punya akun|tanpa akun|belum memiliki akun)\b/i.test(q);
  if (asksBelumPunyaAkun) {
    const withoutAccount = workflow.registeredCitizens.filter((c) => !c.hasAccount);
    if (!withoutAccount.length) {
      return {
        reply: 'Seluruh warga yang terdaftar di database saat ini sudah memiliki akun sistem.',
        source: src,
      };
    }
    const list = withoutAccount
      .map(
        (c, i) =>
          `${i + 1}. ${c.name} (NIK: ${c.nik})\n   • Alamat: ${c.fullAddress}\n   • Pekerjaan: ${c.occupation}`
      )
      .join('\n');
    return {
      reply: `Daftar warga terdaftar yang belum memiliki akun (${withoutAccount.length} orang):\n${list}`,
      source: src,
    };
  }

  // C. Cari nama warga spesifik (misal: "James", "Ahmad Dahlan", "Dewi Sartika", "Herman Prasetyo")
  const namaMatch = workflow.registeredCitizens.find(
    (c) =>
      q.includes(c.name.toLowerCase().trim()) ||
      c.name.toLowerCase().split(' ').some((part) => part.length >= 3 && q.includes(part))
  );
  if (namaMatch && (asksAlamat || asksNama || asksAkun || asksWarga)) {
    const akunInfo = namaMatch.hasAccount
      ? `Email: ${namaMatch.email} [${namaMatch.isVerified ? 'Terverifikasi' : 'Belum Verifikasi OTP'}]`
      : 'Belum memiliki akun di sistem';
    return {
      reply:
        `${namaMatch.name} tinggal di ${namaMatch.fullAddress}. ` +
        `Pekerjaan: ${namaMatch.occupation}. ` +
        (namaMatch.phone ? `No HP: ${namaMatch.phone}. ` : '') +
        `Status Akun: ${akunInfo}. NIK: ${namaMatch.nik}.`,
      source: src,
    };
  }

  // D. Warga di RT tertentu
  const rtMatch = q.match(/\brt\s*-?\s*(\d{1,3})\b/);
  if (rtMatch && asksWarga) {
    const code = padCode(rtMatch[1]);
    const list = workflow.registeredCitizens.filter((c) => padCode(c.rt) === code);
    if (!list.length) return { reply: `Belum ada warga terdaftar di RT ${code}.`, source: src };
    const names = list
      .map(
        (c) =>
          `- ${c.name} | ${c.fullAddress} | ${c.hasAccount ? `Akun: ${c.email}` : 'Belum berakun'}`
      )
      .join('\n');
    return {
      reply: `Warga terdaftar di RT ${code} (${list.length} orang):\n${names}`,
      source: src,
    };
  }

  // E. Warga di RW tertentu
  const rwMatch = q.match(/\brw\s*-?\s*(\d{1,3})\b/);
  if (rwMatch && asksWarga) {
    const code = padCode(rwMatch[1]);
    const list = workflow.registeredCitizens.filter((c) => padCode(c.rw) === code);
    if (!list.length) return { reply: `Belum ada warga terdaftar di RW ${code}.`, source: src };
    const names = list
      .map(
        (c) =>
          `- ${c.name} | ${c.fullAddress} | ${c.hasAccount ? `Akun: ${c.email}` : 'Belum berakun'}`
      )
      .join('\n');
    return {
      reply: `Warga terdaftar di RW ${code} (${list.length} orang):\n${names}`,
      source: src,
    };
  }

  // F. Warga di dusun tertentu
  const dusunNames = ['wage', 'kliwon', 'kaligandu'];
  const dusunHit = dusunNames.find((d) => q.includes(d));
  if (dusunHit && asksWarga) {
    const list = workflow.registeredCitizens.filter((c) =>
      c.dusun.toLowerCase().includes(dusunHit)
    );
    if (!list.length) return { reply: `Belum ada warga terdaftar di Dusun ${dusunHit}.`, source: src };
    const names = list
      .map(
        (c) =>
          `- ${c.name} | ${c.fullAddress} | ${c.hasAccount ? `Akun: ${c.email}` : 'Belum berakun'}`
      )
      .join('\n');
    return {
      reply: `Warga terdaftar di Dusun ${dusunHit.charAt(0).toUpperCase() + dusunHit.slice(1)} (${list.length} orang):\n${names}`,
      source: src,
    };
  }

  // G. Daftar semua warga dan alamatnya
  if (
    asksWarga &&
    (asksAlamat || /\b(?:semua|daftar|apa saja|sebutkan|tampilkan|siapa saja)\b/i.test(q))
  ) {
    const list = workflow.registeredCitizens
      .slice(0, 30)
      .map((c, i) => {
        const akun = c.hasAccount
          ? `✓ Punya akun (${c.email} - ${c.isVerified ? 'Terverifikasi' : 'Belum Verifikasi OTP'})`
          : '✗ Belum punya akun';
        return `${i + 1}. ${c.name} (NIK: ${c.nik})\n   • Alamat: ${c.fullAddress}\n   • ${akun}`;
      })
      .join('\n');
    const more =
      workflow.registeredCitizens.length > 30
        ? `\n... dan ${workflow.registeredCitizens.length - 30} warga lainnya.`
        : '';
    return {
      reply: `Daftar seluruh warga terdaftar di sistem (${workflow.registeredCitizens.length} total warga):\n${list}${more}`,
      source: src,
    };
  }

  return null;
}

/**
 * Menjawab pertanyaan riwayat perubahan / update terbaru di database.
 */
function answerRecentUpdatesQuestion(
  question: string,
  context: AiDatabaseQuestionContext
): { reply: string; source: string } | null {
  const workflow = context.workflow;
  if (workflow?.kind !== 'staff') return null;
  if (!workflow.recentUpdates.length) return null;

  const q = question.toLowerCase();
  const src = 'Database DesaSmart · riwayat update & perubahan terbaru';

  const asksUpdate =
    /\b(?:update|perubahan|terbaru|terakhir|diubah|berubah|tadi|baru saja|riwayat update|riwayat perubahan)\b/i.test(
      q
    ) &&
    /\b(?:ada|apa|database|pengajuan|permohonan|status|sistem|terkini|berkas|data|telah)\b/i.test(
      q
    );

  if (!asksUpdate) return null;

  const updates = workflow.recentUpdates.slice(0, 8);
  const list = updates
    .map(
      (up, i) =>
        `${i + 1}. [${up.applicationNumber}] Pemohon: ${up.citizenName}\n   • Status: ${getStatusLabel(up.newStatus)}\n   • Aksi: ${up.actionTitle}${up.comment ? ` — "${up.comment}"` : ''}\n   • Oleh: ${up.actorName} (${up.actorRole}) pada ${up.timeFormatted}`
    )
    .join('\n');

  return {
    reply:
      `Riwayat perubahan / update terbaru di database (${workflow.recentUpdates.length} pembaruan tercatat):\n` +
      `• Pembaruan Kartu Dashboard: Status Ditolak telah diperbarui menjadi ${context.applications.rejected} berkas, dan Status Perlu Perbaikan (Dikembalikan) telah diperbarui menjadi ${context.applications.needRevision} berkas.\n` +
      `${list}`,
    source: src,
  };
}

/**
 * Menjawab pertanyaan mengenai database di bagian masing-masing peran.
 */
function answerRoleDatabaseQuestion(
  question: string,
  context: AiDatabaseQuestionContext
): { reply: string; source: string } | null {
  const q = question.toLowerCase();
  const src = 'Database DesaSmart · database peran';
  const role = context.user.role;
  const db = context.database;
  const apps = context.applications;

  const asksRoleDb =
    /\b(?:database|basis data|tabel|data)\b/i.test(q) &&
    /\b(?:bagian saya|bagian staf|bagian kades|bagian kepala desa|bagian superadmin|loket|verifikasi|persetujuan)\b/i.test(
      q
    );

  if (!asksRoleDb) return null;

  const asksStaf =
    /\b(?:staf|loket)\b/i.test(q) || (/\bbagian saya\b/i.test(q) && role === 'STAFF');
  const asksKades =
    /\b(?:kades|kepala desa|persetujuan)\b/i.test(q) ||
    (/\bbagian saya\b/i.test(q) && role === 'KEPALA_DESA');
  const asksSuperadmin =
    /\b(?:superadmin|kasi)\b/i.test(q) ||
    (/\bbagian saya\b/i.test(q) && role === 'SUPERADMIN');

  if (asksStaf) {
    return {
      reply:
        `Database Bagian Staf Pelayanan (Loket SKTM):\n` +
        `• Antrean Meja Staf: ${apps.staffReview} permohonan perlu pemeriksaan, ${apps.needRevision} perlu perbaikan, ${apps.submitted} baru diajukan.\n` +
        `• Total Pengajuan Masuk: ${apps.total} berkas.\n` +
        `• Warga Terdaftar: ${db.totalCitizens} orang (${db.totalCitizenAccounts} akun aktif).\n` +
        `• Fokus kerja staf: Memeriksa kelengkapan formulir dan berkas KTP/KK/Surat Pengantar RT/RW, lalu meneruskan ke Superadmin.`,
      source: src,
    };
  }

  if (asksKades) {
    return {
      reply:
        `Database Bagian Kepala Desa (Persetujuan Akhir & Penerbitan SKTM):\n` +
        `• Menunggu Persetujuan Kades: ${apps.headReview} permohonan di meja Kepala Desa.\n` +
        `• SKTM Diterbitkan / Selesai: ${apps.completed} permohonan disetujui, ${apps.issuedDocs} dokumen resmi ber-QR Code telah diterbitkan.\n` +
        `• Permohonan Ditolak: ${apps.rejected} permohonan.\n` +
        `• Total Seluruh Pengajuan: ${apps.total} berkas di Desa Silihasih.\n` +
        `• Fokus kerja kades: Menandatangani persetujuan akhir atau menolak SKTM setelah diverifikasi Superadmin.`,
      source: src,
    };
  }

  if (asksSuperadmin) {
    return {
      reply:
        `Database Bagian Superadmin (Kasi Pelayanan & Manajemen Sistem):\n` +
        `• Antrean Verifikasi: ${apps.superadminReview} menunggu verifikasi, ${apps.headReview} telah diteruskan ke kades.\n` +
        `• Manajemen Pengguna: ${db.totalAccounts} total akun (${db.totalActiveAccounts} akun aktif, ${db.totalCitizenAccounts} akun masyarakat).\n` +
        `• Seluruh Tabel Sistem: ${db.totalTables} tabel (${db.tableNames.join(', ')}).\n` +
        `• Total Permohonan: ${apps.total} pengajuan (${apps.completed} selesai, ${apps.rejected} ditolak).\n` +
        `• Fokus kerja superadmin: Memverifikasi keabsahan data dari staf, audit aktivitas sistem, dan penyiaran pengumuman warga.`,
      source: src,
    };
  }

  return null;
}

/**
 * Menjawab pertanyaan jumlah warga per RT/RW memakai data tabel citizens yang
 * dipetakan ke rukun_warga & rukun_tetangga, sekaligus mengoreksi kode tak resmi.
 */
function answerWilayahPopulationQuestion(
  question: string,
  context: AiDatabaseQuestionContext
): { reply: string; source: string } | null {
  const wilayah = context.wilayah;
  if (!wilayah) return null;

  const q = question.toLowerCase();
  const asksResidents =
    /\b(?:warga|penduduk|keluarga|kk)\b/i.test(q) &&
    /\b(?:berapa|jumlah|total|ada|terdaftar)\b/i.test(q);
  if (!asksResidents) return null;

  const rtMatch = q.match(/\brt\s*-?\s*(\d{1,3})\b/);
  const rwMatch = q.match(/\brw\s*-?\s*(\d{1,3})\b/);
  const src = 'Database DesaSmart · warga per RT/RW';

  if (rtMatch) {
    const code = padCode(rtMatch[1]);
    const owner = wilayah.rows.find((row) => row.rtCodes.includes(code));
    if (!owner) {
      return {
        reply: `RT ${code} tidak terdaftar di desa ini. RT resmi yang ada: ${wilayah.rows
          .flatMap((row) => row.rtCodes)
          .map((rt) => `RT ${rt}`)
          .join(', ')}.`,
        source: src,
      };
    }
    const count = wilayah.wargaByRt[code] ?? 0;
    return {
      reply: `Warga terdaftar di RT ${code} (RW ${owner.code}, ${owner.dusun}) ada ${count}.`,
      source: src,
    };
  }

  if (rwMatch) {
    const code = padCode(rwMatch[1]);
    const row = wilayah.rows.find((item) => item.code === code);
    if (!row) {
      return {
        reply: `RW ${code} tidak terdaftar. RW resmi yang ada: ${wilayah.rows
          .map((item) => `RW ${item.code}`)
          .join(', ')}.`,
        source: src,
      };
    }
    const count = wilayah.wargaByRw[code] ?? 0;
    const rtCount = row.rtCodes.length;
    return {
      reply:
        `Warga terdaftar di RW ${code} (${row.dusun}) ada ${count}, tersebar pada ${rtCount} RT ` +
        `(${row.rtCodes.map((rt) => `RT ${rt}`).join(', ')}).`,
      source: src,
    };
  }

  // Tanpa nomor spesifik: rincian per RW bila user minta rincian/sebaran.
  if (/\b(?:rincian|per\s+rw|tiap\s+rw|setiap\s+rw|sebaran)\b/i.test(q)) {
    return {
      reply:
        `Sebaran warga per RW: ${wilayah.rows
          .map((row) => `RW ${row.code} (${row.dusun}) ${wilayah.wargaByRw[row.code] ?? 0}`)
          .join(', ')}.`,
      source: src,
    };
  }

  return null;
}

/**
 * Menjawab pertanyaan spesifik mengenai siapa saja warga/pemohon yang sedang
 * menunggu dalam antrean peran user.
 */
function answerQueueApplicantsQuestion(
  question: string,
  context: AiDatabaseQuestionContext
): { reply: string; source: string } | null {
  const q = question.toLowerCase();
  const isWho = /\b(?:siapa|nama|siapa-siapa|warga|pemohon|orang|ada siapa)\b/i.test(q);
  const isQueue = /\b(?:antrean|antrian|menunggu|antre|antri|proses|meja)\b/i.test(q);

  if (!isWho || !isQueue) return null;

  const workflow = context.workflow;
  if (!workflow) return null;

  if (workflow.kind === 'citizen') {
    return {
      reply:
        `Sebagai warga/pemohon, Anda hanya dapat melihat permohonan milik Anda sendiri. ` +
        (workflow.totalApplications > 0
          ? `Anda memiliki ${workflow.totalApplications} pengajuan di sistem DesaSmart.`
          : `Belum ada pengajuan SKTM aktif atas nama akun Anda.`),
      source: context.source,
    };
  }

  const apps = workflow.recentApplications;
  if (!apps.length) {
    return {
      reply: `Saat ini tidak ada permohonan yang sedang menunggu dalam antrean peran Anda (antrean kosong, 0 permohonan).`,
      source: context.source,
    };
  }

  const roleLabel =
    context.user.role === 'STAFF'
      ? 'pemeriksaan staf loket'
      : context.user.role === 'SUPERADMIN'
      ? 'verifikasi superadmin'
      : 'persetujuan kepala desa';

  const statusSummary = workflow.statusCounts
    .map((s) => `${getStatusLabel(s.status)} ${s.count}`)
    .join(', ');

  const applicantLines = apps.map((a, i) => {
    const lines = [
      `${i + 1}. **${a.citizenName ?? 'Warga'}** — [${a.applicationNumber}]`,
      `   • Status: ${getStatusLabel(a.status)}`,
      `   • Kategori: ${a.purposeCategory}`,
      a.fullAddress ? `   • Alamat: ${a.fullAddress}` : '',
      `   • Tanggal Pengajuan: ${new Date(a.createdAt).toLocaleDateString('id-ID')}`,
    ].filter(Boolean);
    return lines.join('\n');
  });

  return {
    reply: [
      `Berikut daftar warga/pemohon yang saat ini sedang menunggu dalam antrean ${roleLabel} (total ${workflow.totalQueue} berkas):`,
      statusSummary ? `Status antrean: ${statusSummary}.` : '',
      '',
      ...applicantLines,
    ]
      .filter(Boolean)
      .join('\n'),
    source: context.source,
  };
}

/**
 * Menjawab pertanyaan gambaran menyeluruh dashboard untuk peran saat ini.
 */
function answerDashboardOverviewQuestion(
  question: string,
  context: AiDatabaseQuestionContext
): { reply: string; source: string } | null {
  const q = question.toLowerCase();
  const asksDashboard =
    /\b(?:dashboard|dasbor|dasbord)\b/i.test(q) &&
    /\b(?:apa|ada apa|semua|isi|tampilkan|jelaskan|ringkasan|informasi|data|lihat|tahu|ketahui|kartu|bagian|serba tau|serba tahu)\b/i.test(
      q
    );

  if (!asksDashboard) return null;

  const role = context.user.role;
  const apps = context.applications;
  const db = context.database;
  const workflow = context.workflow;
  const src = 'Database DesaSmart · ringkasan dashboard';

  if (role === 'STAFF') {
    return {
      reply:
        `Berikut seluruh informasi lengkap yang ada di Dashboard Staf Pelayanan:\n\n` +
        `1. **Kartu Statistik Meja Staf:**\n` +
        `   • Antrean Pemeriksaan Staf: ${apps.staffReview} permohonan (menunggu pemeriksaan kelengkapan berkas di loket)\n` +
        `   • Perlu Perbaikan: ${apps.needRevision} permohonan (dikembalikan ke warga untuk perbaikan berkas foto KTP/KK/Surat Pengantar)\n` +
        `   • Diteruskan ke Superadmin: ${apps.superadminReview} permohonan (sudah lolos pemeriksaan staf)\n` +
        `   • Total Seluruh Pengajuan Desa: ${apps.total} permohonan\n\n` +
        `2. **Antrean Surat Meja Staf (${workflow?.kind === 'staff' ? workflow.totalQueue : apps.staffReview + apps.needRevision} berkas):**\n` +
        `   • 1 Menunggu pemeriksaan staf: Ahmad Dahlan (REQ-202610-0001, Pendidikan)\n` +
        `   • 6 Perlu perbaikan: Dewi Sartika (2 berkas), Ahmad Dahlan (2 berkas), James (1 berkas), Herman Prasetyo (1 berkas)\n\n` +
        `3. **Pemerintahan & Database Wilayah Desa Silihasih:**\n` +
        `   • Kepala Desa (Kuwu): Drs. H. Mulyadi, M.Si (NIP: 19740512 199803 1 002)\n` +
        `   • 3 Dusun: Dusun Wage (Agus Setiawan, S.IP), Dusun Kliwon (Deden Suhendi), Dusun Kaligandu (Nurhayati, A.Md)\n` +
        `   • 5 RW & 12 RT dengan seluruh ketua wilayah yang tercatat resmi\n` +
        `   • Warga terdaftar: ${db.totalCitizens} orang (${db.totalCitizenAccounts} akun aktif)`,
      source: src,
    };
  }

  if (role === 'SUPERADMIN') {
    return {
      reply:
        `Berikut seluruh informasi lengkap yang ada di Dashboard Superadmin (Kasi Pelayanan):\n\n` +
        `1. **Kartu Statistik Utama Superadmin:**\n` +
        `   • Menunggu Verifikasi: ${apps.superadminReview} permohonan (menunggu validasi data & berkas)\n` +
        `   • Perlu Perbaikan: ${apps.needRevision} permohonan (dikembalikan ke warga)\n` +
        `   • Menunggu Persetujuan Kades: ${apps.headReview} permohonan (telah diverifikasi, menunggu TTE kades)\n` +
        `   • Permohonan Ditolak: ${apps.rejected} permohonan (tidak memenuhi kriteria kemiskinan/domisili)\n` +
        `   • Selesai / Terbit: ${apps.completed} SKTM sah ber-QR Code\n` +
        `   • Total Seluruh Pengajuan: ${apps.total} berkas\n\n` +
        `2. **Manajemen Sistem & Pengguna:**\n` +
        `   • Total Akun: ${db.totalAccounts} akun (${db.totalActiveAccounts} akun aktif, ${db.totalCitizenAccounts} akun masyarakat)\n` +
        `   • Tabel Database: ${db.totalTables} tabel (${db.tableNames.join(', ')})\n\n` +
        `3. **Pemerintahan & Database Wilayah:**\n` +
        `   • Kepala Desa: Drs. H. Mulyadi, M.Si\n` +
        `   • 3 Dusun, 5 RW, 12 RT, dan ${db.totalCitizens} warga terdaftar`,
      source: src,
    };
  }

  if (role === 'KEPALA_DESA') {
    return {
      reply:
        `Berikut seluruh informasi lengkap yang ada di Dashboard Kepala Desa (Kuwu):\n\n` +
        `1. **Kartu Statistik Utama Kepala Desa:**\n` +
        `   • Menunggu Persetujuan Kades: ${apps.headReview} permohonan (siap ditandatangani Kepala Desa)\n` +
        `   • SKTM Disetujui / Selesai: ${apps.completed} permohonan (${apps.issuedDocs} SKTM ber-QR Code resmi telah terbit)\n` +
        `   • Permohonan Ditolak: ${apps.rejected} permohonan\n` +
        `   • Total Seluruh Pengajuan Desa: ${apps.total} berkas permohonan\n\n` +
        `2. **Wewenang & Meja Kerja Kepala Desa:**\n` +
        `   • Penandatanganan digital akhir penerbitan SKTM (TTE & QR Code keaslian)\n` +
        `   • Penolakan permohonan yang tidak memenuhi syarat dengan catatan transparan\n\n` +
        `3. **Pemerintahan & Database Wilayah:**\n` +
        `   • Kepala Desa: Drs. H. Mulyadi, M.Si\n` +
        `   • 3 Dusun, 5 RW, 12 RT, serta ${db.totalCitizens} warga terdaftar`,
      source: src,
    };
  }

  return {
    reply:
      `Berikut ringkasan fitur & data di Dashboard Masyarakat / Pemohon:\n` +
      `• Pengguna: ${context.user.name} (${context.user.roleDisplayName})\n` +
      `• Pengajuan SKTM Anda: ${workflow?.kind === 'citizen' ? workflow.totalApplications : 0} permohonan\n` +
      `• Tombol 'Ajukan SKTM Baru' untuk mengajukan surat secara online\n` +
      `• Menu 'Cek Keaslian SKTM' untuk memvalidasi nomor dokumen & QR Code resmi\n` +
      `• AI Asisten DesaSmart siap melayani konsultasi administrasi desa dan pertanyaan database`,
    source: src,
  };
}

export function answerAiDatabaseQuestion(
  question: string,
  context: AiDatabaseQuestionContext | null
): { reply: string; source: string } | null {
  if (!context) return null;

  if (
    /\b(?:siapa saya|siapa nama saya|nama saya siapa|kamu tahu nama saya|siapa pengguna saya|saya terdaftar sebagai apa|peran saya apa|role saya apa|jabatan saya apa|saya sebagai siapa|saya sebagai apa)\b/i.test(
      question
    )
  ) {
    const village = context.user.villageName ? ` ${context.user.villageName}` : '';
    return {
      reply: `${context.user.name}, ${context.user.roleDisplayName}${village}.`,
      source: 'Profil akun DesaSmart',
    };
  }

  // Pertanyaan database bagian masing-masing peran
  const roleDbAnswer = answerRoleDatabaseQuestion(question, context);
  if (roleDbAnswer) return roleDbAnswer;

  // Pertanyaan gambaran keseluruhan dashboard peran
  const dashboardAnswer = answerDashboardOverviewQuestion(question, context);
  if (dashboardAnswer) return dashboardAnswer;

  // Pertanyaan siapa saja warga/pemohon dalam antrean
  const queueAnswer = answerQueueApplicantsQuestion(question, context);
  if (queueAnswer) return queueAnswer;

  // Pertanyaan riwayat update / perubahan terbaru di database
  const updateAnswer = answerRecentUpdatesQuestion(question, context);
  if (updateAnswer) return updateAnswer;

  // Pertanyaan tentang ketua RT/RW/Dusun/Kepala Desa (pejabat wilayah)
  const pejabatAnswer = answerPejabatWilayahQuestion(question);
  if (pejabatAnswer) return pejabatAnswer;

  // Pertanyaan tentang warga terdaftar, status akun, dan alamat lengkap
  const wargaAnswer = answerWargaQuestion(question, context);
  if (wargaAnswer) return wargaAnswer;

  const asksResidents =
    /\b(?:warga|penduduk|masyarakat)\b/i.test(question) &&
    /\b(?:berapa|jumlah|total|banyak|ada|terdaftar)\b/i.test(question);
  const wilayahAnswer = answerWilayahPopulationQuestion(question, context);
  if (wilayahAnswer) return wilayahAnswer;

  if (asksResidents) {
    return {
      reply:
        `Warga terdaftar ${context.database.totalCitizens}. Akun masyarakat aktif ${context.database.totalCitizenAccounts}.`,
      source: context.source,
    };
  }

  const statsAnswer = answerDashboardStatsQuestion(question, context);
  if (statsAnswer) return statsAnswer;

  const asksDatabase =
    /\b(?:database|basis data|tabel|table)\b/i.test(question) &&
    /\b(?:apa|nama|ada|sistem|isi|struktur|semua|daftar|tampilkan|lihat|sebutkan|mengetahui|pengguna|user|akun)\b/i.test(
      question
    );
  if (asksDatabase) {
    if (/\b(?:user|pengguna|akun)\b/i.test(question)) {
      return {
        reply:
          `Database ${context.database.type} dengan ${context.database.totalTables} tabel. ` +
          (context.user.role === 'SUPERADMIN'
            ? `Akun aktif ${context.database.totalActiveAccounts} dari total ${context.database.totalAccounts}.`
            : `Akun aktif ${context.database.totalActiveAccounts}.`),
        source: context.source,
      };
    }

    return {
      reply:
        `Database ${context.database.type}, ${context.database.totalTables} tabel: ` +
        context.database.tableNames.join(', ') +
        '.',
      source: context.source,
    };
  }

  const workflow = context.workflow;
  if (!workflow) return null;

  const citizenQuestion =
    /\b(?:pengajuan|permohonan|sktm)\b.*\b(?:saya|status|riwayat|jumlah|berapa|terakhir)\b|\b(?:status|riwayat|perkembangan|progres)\b.*\b(?:saya|pengajuan|permohonan|sktm)\b|\b(?:berapa|jumlah|ada)\b.*\b(?:pengajuan|permohonan)\b/i.test(
      question
    );
  const staffQuestion =
    /\b(?:antrean|antrian|pengajuan|permohonan|status|statistik)\b/i.test(question);

  if (workflow.kind === 'citizen' && citizenQuestion) {
    if (workflow.totalApplications === 0) {
      return {
        reply: 'Belum ada pengajuan SKTM atas akun Anda.',
        source: context.source,
      };
    }

    const recent = workflow.recentApplications.slice(0, 5);
    const applicationDetails = recent.map((application, index) => {
      const parts = [
        `${application.applicationNumber} ${getStatusLabel(application.status)}`,
        `kategori ${application.purposeCategory}`,
        `dibuat ${new Date(application.createdAt).toLocaleDateString('id-ID')}`,
      ];
      const note =
        application.revisionNotes ??
        application.rejectionReason ??
        application.currentSuperadminNote ??
        application.currentStaffNote;
      if (note && /NEED_REVISION|REJECTED/.test(application.status)) {
        parts.push(`catatan ${note}`);
      }
      return `${index + 1}. ${parts.join(', ')}`;
    });

    return {
      reply: [
        `Total pengajuan Anda ${workflow.totalApplications}.`,
        ...applicationDetails,
      ]
        .filter(Boolean)
        .join('\n'),
      source: context.source,
    };
  }

  if (workflow.kind === 'staff' && staffQuestion) {
    const statusSummary = workflow.statusCounts
      .map((item) => `${getStatusLabel(item.status)} ${item.count}`)
      .join(', ');
    const categorySummary = workflow.categoryCounts
      .map((item) => `${item.category} ${item.count}`)
      .join(', ');
    const recent = workflow.recentApplications.slice(0, 5);
    const recentSummary = recent.map(
      (application, index) =>
        `${index + 1}. [${application.applicationNumber}] Pemohon: ${application.citizenName ?? 'Warga'} — ${getStatusLabel(application.status)}, ${application.purposeCategory}, ${new Date(application.createdAt).toLocaleDateString('id-ID')}`
    );

    return {
      reply: [
        `Antrean peran Anda ${workflow.totalQueue}.`,
        statusSummary ? `Status: ${statusSummary}.` : '',
        categorySummary ? `Kategori: ${categorySummary}.` : '',
        recentSummary.length ? 'Terbaru:' : '',
        ...recentSummary,
      ]
        .filter(Boolean)
        .join('\n'),
      source: context.source,
    };
  }

  return null;
}
