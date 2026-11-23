-- ========================================================
-- DesaSmart - Sistem Pelayanan SKTM & Asisten AI Desa
-- Database Dump untuk MySQL (Kompatibel phpMyAdmin / InfinityFree)
-- Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- 1. Tabel: roles
-- --------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `displayName` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Tabel: villages
-- --------------------------------------------------------
DROP TABLE IF EXISTS `villages`;
CREATE TABLE `villages` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `district` VARCHAR(191) NOT NULL,
  `regency` VARCHAR(191) NOT NULL,
  `province` VARCHAR(191) NOT NULL,
  `postalCode` VARCHAR(191) NOT NULL,
  `address` TEXT NOT NULL,
  `phone` VARCHAR(191) NULL,
  `email` VARCHAR(191) NULL,
  `website` VARCHAR(191) NULL,
  `headVillageName` VARCHAR(191) NOT NULL,
  `headVillageNip` VARCHAR(191) NULL,
  `logoUrl` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `villages_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Tabel: rukun_warga
-- --------------------------------------------------------
DROP TABLE IF EXISTS `rukun_warga`;
CREATE TABLE `rukun_warga` (
  `id` VARCHAR(191) NOT NULL,
  `villageId` VARCHAR(191) NOT NULL,
  `dusun` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `rukun_warga_villageId_code_key` (`villageId`, `code`),
  CONSTRAINT `rukun_warga_villageId_fkey` FOREIGN KEY (`villageId`) REFERENCES `villages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Tabel: rukun_tetangga
-- --------------------------------------------------------
DROP TABLE IF EXISTS `rukun_tetangga`;
CREATE TABLE `rukun_tetangga` (
  `id` VARCHAR(191) NOT NULL,
  `rwId` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `rukun_tetangga_rwId_code_key` (`rwId`, `code`),
  CONSTRAINT `rukun_tetangga_rwId_fkey` FOREIGN KEY (`rwId`) REFERENCES `rukun_warga` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Tabel: users
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NULL,
  `roleId` VARCHAR(191) NOT NULL,
  `villageId` VARCHAR(191) NULL,
  `avatarUrl` LONGTEXT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `isVerified` TINYINT(1) NOT NULL DEFAULT 1,
  `otpCode` VARCHAR(191) NULL,
  `otpExpiresAt` DATETIME(3) NULL,
  `otpSentAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_roleId_idx` (`roleId`),
  KEY `users_villageId_idx` (`villageId`),
  CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `users_villageId_fkey` FOREIGN KEY (`villageId`) REFERENCES `villages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. Tabel: citizens
-- --------------------------------------------------------
DROP TABLE IF EXISTS `citizens`;
CREATE TABLE `citizens` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `nik` VARCHAR(191) NOT NULL,
  `noKk` VARCHAR(191) NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `birthPlace` VARCHAR(191) NOT NULL,
  `birthDate` DATETIME(3) NOT NULL,
  `gender` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NULL,
  `address` TEXT NOT NULL,
  `rt` VARCHAR(191) NOT NULL,
  `rw` VARCHAR(191) NOT NULL,
  `dusun` VARCHAR(191) NOT NULL,
  `desa` VARCHAR(191) NOT NULL,
  `kecamatan` VARCHAR(191) NOT NULL,
  `kabupaten` VARCHAR(191) NOT NULL,
  `occupation` VARCHAR(191) NOT NULL,
  `monthlyIncome` INT NOT NULL,
  `familyMembersCount` INT NOT NULL,
  `houseCondition` VARCHAR(191) NOT NULL,
  `economicDescription` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `citizens_userId_key` (`userId`),
  UNIQUE KEY `citizens_nik_key` (`nik`),
  CONSTRAINT `citizens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. Tabel: applications
-- --------------------------------------------------------
DROP TABLE IF EXISTS `applications`;
CREATE TABLE `applications` (
  `id` VARCHAR(191) NOT NULL,
  `applicationNumber` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `citizenId` VARCHAR(191) NOT NULL,
  `villageId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'SUBMITTED',
  `purposeCategory` VARCHAR(191) NOT NULL,
  `purposeDescription` TEXT NOT NULL,
  `currentStaffNote` TEXT NULL,
  `currentSuperadminNote` TEXT NULL,
  `rejectionReason` TEXT NULL,
  `revisionNotes` TEXT NULL,
  `aiCompletenessScore` INT NULL DEFAULT 100,
  `aiAnalysisResult` LONGTEXT NULL,
  `submittedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reviewedByStaffAt` DATETIME(3) NULL,
  `reviewedBySuperadminAt` DATETIME(3) NULL,
  `approvedByHeadAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `applications_applicationNumber_key` (`applicationNumber`),
  KEY `applications_userId_idx` (`userId`),
  KEY `applications_citizenId_idx` (`citizenId`),
  KEY `applications_villageId_idx` (`villageId`),
  CONSTRAINT `applications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `applications_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `citizens` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `applications_villageId_fkey` FOREIGN KEY (`villageId`) REFERENCES `villages` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. Tabel: application_documents
-- --------------------------------------------------------
DROP TABLE IF EXISTS `application_documents`;
CREATE TABLE `application_documents` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `documentType` VARCHAR(191) NOT NULL,
  `fileName` VARCHAR(191) NOT NULL,
  `fileUrl` LONGTEXT NOT NULL,
  `fileType` VARCHAR(191) NOT NULL,
  `fileSize` INT NOT NULL,
  `ocrExtractedText` LONGTEXT NULL,
  `ocrMatchStatus` VARCHAR(191) NULL DEFAULT 'MATCH',
  `ocrMismatchReason` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `application_documents_applicationId_idx` (`applicationId`),
  CONSTRAINT `application_documents_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. Tabel: application_reviews
-- --------------------------------------------------------
DROP TABLE IF EXISTS `application_reviews`;
CREATE TABLE `application_reviews` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `reviewerId` VARCHAR(191) NOT NULL,
  `reviewerRole` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `application_reviews_applicationId_idx` (`applicationId`),
  KEY `application_reviews_reviewerId_idx` (`reviewerId`),
  CONSTRAINT `application_reviews_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `application_reviews_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 10. Tabel: application_status_histories
-- --------------------------------------------------------
DROP TABLE IF EXISTS `application_status_histories`;
CREATE TABLE `application_status_histories` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `changedById` VARCHAR(191) NOT NULL,
  `previousStatus` VARCHAR(191) NULL,
  `newStatus` VARCHAR(191) NOT NULL,
  `actionTitle` VARCHAR(191) NOT NULL,
  `comment` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `application_status_histories_applicationId_idx` (`applicationId`),
  KEY `application_status_histories_changedById_idx` (`changedById`),
  CONSTRAINT `application_status_histories_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `application_status_histories_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 11. Tabel: notifications
-- --------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(191) NOT NULL DEFAULT 'INFO',
  `isRead` TINYINT(1) NOT NULL DEFAULT 0,
  `linkUrl` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notifications_userId_idx` (`userId`),
  CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 12. Tabel: ai_conversations
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ai_conversations`;
CREATE TABLE `ai_conversations` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL DEFAULT 'Percakapan Layanan SKTM',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ai_conversations_userId_idx` (`userId`),
  CONSTRAINT `ai_conversations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 13. Tabel: ai_messages
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ai_messages`;
CREATE TABLE `ai_messages` (
  `id` VARCHAR(191) NOT NULL,
  `conversationId` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `sources` LONGTEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ai_messages_conversationId_idx` (`conversationId`),
  CONSTRAINT `ai_messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 14. Tabel: ai_settings
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ai_settings`;
CREATE TABLE `ai_settings` (
  `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
  `providerName` VARCHAR(191) NULL,
  `baseUrl` TEXT NULL,
  `model` VARCHAR(191) NULL,
  `apiKey` TEXT NULL,
  `activeCredentialId` VARCHAR(191) NULL,
  `updatedById` VARCHAR(191) NULL,
  `updatedByName` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 15. Tabel: ai_credentials
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ai_credentials`;
CREATE TABLE `ai_credentials` (
  `id` VARCHAR(191) NOT NULL,
  `providerName` VARCHAR(191) NOT NULL,
  `baseUrl` TEXT NOT NULL,
  `model` VARCHAR(191) NOT NULL,
  `apiKey` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ai_credentials_providerName_model_key` (`providerName`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 16. Tabel: generated_documents
-- --------------------------------------------------------
DROP TABLE IF EXISTS `generated_documents`;
CREATE TABLE `generated_documents` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `documentNumber` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL DEFAULT 'SURAT KETERANGAN TIDAK MAMPU',
  `qrCodeData` LONGTEXT NOT NULL,
  `signedByName` VARCHAR(191) NOT NULL,
  `signedByTitle` VARCHAR(191) NOT NULL DEFAULT 'Kepala Desa',
  `issuedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `pdfUrl` LONGTEXT NULL,
  `documentHash` VARCHAR(191) NOT NULL,
  `isValid` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `generated_documents_applicationId_key` (`applicationId`),
  UNIQUE KEY `generated_documents_documentNumber_key` (`documentNumber`),
  CONSTRAINT `generated_documents_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 17. Tabel: audit_logs
-- --------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `userEmail` VARCHAR(191) NULL,
  `userRole` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `entity` VARCHAR(191) NOT NULL,
  `entityId` VARCHAR(191) NULL,
  `ipAddress` VARCHAR(191) NULL,
  `userAgent` TEXT NULL,
  `details` LONGTEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_userId_idx` (`userId`),
  CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- SEED DATA (Data Awal Resmi)
-- Password untuk semua akun default: Password123!
-- Hash Bcrypt: $2a$10$w81o96z2s9dF2Jb/Y5F7p.4vK6L8Z0x1c2v3b4n5m6q7w8e9r0t1
-- ========================================================

-- Roles
INSERT INTO `roles` (`id`, `name`, `displayName`, `description`, `createdAt`, `updatedAt`) VALUES
('role-masyarakat', 'MASYARAKAT', 'Masyarakat / Pemohon', 'Pengguna umum warga desa yang mengajukan layanan administrasi dan SKTM', NOW(), NOW()),
('role-staff', 'STAFF', 'Staf Pelayanan Desa', 'Petugas loket pelayanan yang memeriksa kelengkapan data & berkas', NOW(), NOW()),
('role-superadmin', 'SUPERADMIN', 'Superadmin / Kasi Pelayanan', 'Pejabat verifikator yang memverifikasi keabsahan data dan rekomendasi staf', NOW(), NOW()),
('role-kades', 'KEPALA_DESA', 'Kepala Desa', 'Pimpinan desa yang memberikan persetujuan akhir penerbitan SKTM', NOW(), NOW());

-- Village: Desa Silihasih
INSERT INTO `villages` (`id`, `name`, `code`, `district`, `regency`, `province`, `postalCode`, `address`, `phone`, `email`, `website`, `headVillageName`, `headVillageNip`, `createdAt`, `updatedAt`) VALUES
('village-silihasih', 'Desa Silihasih', '3209212001', 'Kecamatan Pabedilan', 'Kabupaten Cirebon', 'Jawa Barat', '45193', 'Jl. Mayjen Sutoyo No. 12', '(0231) 876-5432', 'pelayanan@silihasih.desa.id', 'https://silihasih.desa.id', 'Drs. H. Mulyadi, M.Si', '19740512 199803 1 002', NOW(), NOW());

-- Rukun Warga (RW)
INSERT INTO `rukun_warga` (`id`, `villageId`, `dusun`, `code`, `name`, `createdAt`, `updatedAt`) VALUES
('rw-001', 'village-silihasih', 'Dusun Wage', '001', 'RW 001', NOW(), NOW()),
('rw-002', 'village-silihasih', 'Dusun Wage', '002', 'RW 002', NOW(), NOW()),
('rw-003', 'village-silihasih', 'Dusun Kliwon', '003', 'RW 003', NOW(), NOW()),
('rw-004', 'village-silihasih', 'Dusun Kliwon', '004', 'RW 004', NOW(), NOW()),
('rw-005', 'village-silihasih', 'Dusun Manis', '005', 'RW 005', NOW(), NOW()),
('rw-006', 'village-silihasih', 'Dusun Manis', '006', 'RW 006', NOW(), NOW());

-- Rukun Tetangga (RT)
INSERT INTO `rukun_tetangga` (`id`, `rwId`, `code`, `name`, `createdAt`, `updatedAt`) VALUES
('rt-001-01', 'rw-001', '001', 'RT 001', NOW(), NOW()),
('rt-001-02', 'rw-001', '002', 'RT 002', NOW(), NOW()),
('rt-001-03', 'rw-001', '003', 'RT 003', NOW(), NOW()),
('rt-001-04', 'rw-001', '004', 'RT 004', NOW(), NOW()),
('rt-002-01', 'rw-002', '001', 'RT 001', NOW(), NOW()),
('rt-002-02', 'rw-002', '002', 'RT 002', NOW(), NOW()),
('rt-002-03', 'rw-002', '003', 'RT 003', NOW(), NOW()),
('rt-002-04', 'rw-002', '004', 'RT 004', NOW(), NOW()),
('rt-003-01', 'rw-003', '001', 'RT 001', NOW(), NOW()),
('rt-003-02', 'rw-003', '002', 'RT 002', NOW(), NOW()),
('rt-003-03', 'rw-003', '003', 'RT 003', NOW(), NOW()),
('rt-003-04', 'rw-003', '004', 'RT 004', NOW(), NOW()),
('rt-004-01', 'rw-004', '001', 'RT 001', NOW(), NOW()),
('rt-004-02', 'rw-004', '002', 'RT 002', NOW(), NOW()),
('rt-004-03', 'rw-004', '003', 'RT 003', NOW(), NOW()),
('rt-004-04', 'rw-004', '004', 'RT 004', NOW(), NOW()),
('rt-005-01', 'rw-005', '001', 'RT 001', NOW(), NOW()),
('rt-005-02', 'rw-005', '002', 'RT 002', NOW(), NOW()),
('rt-005-03', 'rw-005', '003', 'RT 003', NOW(), NOW()),
('rt-005-04', 'rw-005', '004', 'RT 004', NOW(), NOW()),
('rt-006-01', 'rw-006', '001', 'RT 001', NOW(), NOW()),
('rt-006-02', 'rw-006', '002', 'RT 002', NOW(), NOW()),
('rt-006-03', 'rw-006', '003', 'RT 003', NOW(), NOW()),
('rt-006-04', 'rw-006', '004', 'RT 004', NOW(), NOW());

-- Users
-- Password default: Password123!
INSERT INTO `users` (`id`, `email`, `password`, `name`, `phone`, `roleId`, `villageId`, `isActive`, `isVerified`, `createdAt`, `updatedAt`) VALUES
('user-kades', 'h.mulyadi@gmail.go.id', '$2a$10$eEfqw6eL329FhZ4kHQ0xte2l5.wB8E27rOaJv8dD8oP1.rL0G3Y5y', 'Drs. H. Mulyadi, M.Si', '081298765431', 'role-kades', 'village-silihasih', 1, 1, NOW(), NOW()),
('user-superadmin', 'budi.santoso@gmail.go.id', '$2a$10$eEfqw6eL329FhZ4kHQ0xte2l5.wB8E27rOaJv8dD8oP1.rL0G3Y5y', 'Budi Santoso, S.Sos', '081298765432', 'role-superadmin', 'village-silihasih', 1, 1, NOW(), NOW()),
('user-staff', 'siti.rahmawati@gmail.go.id', '$2a$10$eEfqw6eL329FhZ4kHQ0xte2l5.wB8E27rOaJv8dD8oP1.rL0G3Y5y', 'Siti Rahmawati, A.Md', '081298765433', 'role-staff', 'village-silihasih', 1, 1, NOW(), NOW()),
('user-ahmad', 'masyarakat@desa.test', '$2a$10$eEfqw6eL329FhZ4kHQ0xte2l5.wB8E27rOaJv8dD8oP1.rL0G3Y5y', 'Ahmad Dahlan', '081387654321', 'role-masyarakat', 'village-silihasih', 1, 1, NOW(), NOW()),
('user-dewi', 'warga2@desa.test', '$2a$10$eEfqw6eL329FhZ4kHQ0xte2l5.wB8E27rOaJv8dD8oP1.rL0G3Y5y', 'Dewi Sartika', '081311223344', 'role-masyarakat', 'village-silihasih', 1, 1, NOW(), NOW()),
('user-herman', 'warga3@desa.test', '$2a$10$eEfqw6eL329FhZ4kHQ0xte2l5.wB8E27rOaJv8dD8oP1.rL0G3Y5y', 'Herman Prasetyo', '081255667788', 'role-masyarakat', 'village-silihasih', 1, 1, NOW(), NOW());

-- Citizens
INSERT INTO `citizens` (`id`, `userId`, `nik`, `noKk`, `fullName`, `birthPlace`, `birthDate`, `gender`, `phone`, `address`, `rt`, `rw`, `dusun`, `desa`, `kecamatan`, `kabupaten`, `occupation`, `monthlyIncome`, `familyMembersCount`, `houseCondition`, `economicDescription`, `createdAt`, `updatedAt`) VALUES
('cit-ahmad', 'user-ahmad', '3201011504920001', '3201012908050002', 'Ahmad Dahlan', 'Cirebon', '1992-04-15 00:00:00', 'LAKI_LAKI', '081387654321', 'Kp. Babakan RT 003 / RW 001, Dusun Wage', '003', '001', 'Dusun Wage', 'Desa Silihasih', 'Kecamatan Pabedilan', 'Kabupaten Cirebon', 'Buruh Harian Lepas', 1200000, 4, 'Menumpang di rumah orang tua, dinding semi permanen', 'Bekerja serabutan buruh harian lepas dengan penghasilan tidak menentu untuk menghidupi 1 istri dan 2 anak usia sekolah.', NOW(), NOW()),
('cit-dewi', 'user-dewi', '3201014809900005', '3201011204090008', 'Dewi Sartika', 'Cirebon', '1990-09-08 00:00:00', 'PEREMPUAN', '081311223344', 'Jl. Melati Kp. Tengah RT 001 / RW 001, Dusun Wage', '001', '001', 'Dusun Wage', 'Desa Silihasih', 'Kecamatan Pabedilan', 'Kabupaten Cirebon', 'Pedagang Keliling', 950000, 3, 'Sewa kontrakan 1 petak', 'Orang tua tunggal menghidupi 2 anak, jualan gorengan keliling dengan penghasilan tidak menentu.', NOW(), NOW()),
('cit-herman', 'user-herman', '3201012301850003', '3201011505080004', 'Herman Prasetyo', 'Cianjur', '1985-01-23 00:00:00', 'LAKI_LAKI', '081255667788', 'Kp. Pabuaran RT 004 / RW 002, Dusun Wage', '004', '002', 'Dusun Wage', 'Desa Silihasih', 'Kecamatan Pabedilan', 'Kabupaten Cirebon', 'Petani Penggarap', 1100000, 5, 'Rumah bilik sederhana peninggalan keluarga', 'Menggarap lahan sawah sewa musiman, membutuhkan bantuan keringanan biaya pengobatan rawat inap puskesmas.', NOW(), NOW());

-- AI Settings
INSERT INTO `ai_settings` (`id`, `providerName`, `model`, `createdAt`, `updatedAt`) VALUES
('singleton', 'DesaSmart AI', 'llama-3.3-70b-versatile', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- Selesai! Skema dan data awal berhasil diimpor.
-- ========================================================
