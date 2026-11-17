import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

function unauthorized() {
  return NextResponse.json({ error: 'Akses hanya untuk Superadmin.' }, { status: 403 });
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan login kembali.' }, { status: 401 });
    }
    if (currentUser.role !== 'SUPERADMIN') return unauthorized();

    const [users, roles] = await Promise.all([
      prisma.user.findMany({
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          role: { select: { id: true, name: true, displayName: true } },
          village: { select: { name: true } },
        },
      }),
      prisma.role.findMany({
        orderBy: { displayName: 'asc' },
        select: { id: true, name: true, displayName: true },
      }),
    ]);

    return NextResponse.json({
      users,
      roles,
    });
  } catch (error) {
    console.error('Fetch admin users error:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar akun.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan login kembali.' }, { status: 401 });
    }
    if (currentUser.role !== 'SUPERADMIN') return unauthorized();

    const body: unknown = await req.json();
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Data akun tidak valid.' }, { status: 400 });
    }
    const { userId, name, email, phone, roleId, password, isActive } = body as Record<
      string,
      unknown
    >;

    if (typeof userId !== 'string' || !userId) {
      return NextResponse.json({ error: 'ID akun wajib diisi.' }, { status: 400 });
    }
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Anda tidak dapat mengubah atau menonaktifkan akun sendiri di menu ini.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        role: { select: { name: true } },
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    const data: {
      name?: string;
      email?: string;
      phone?: string | null;
      roleId?: string;
      password?: string;
      isActive?: boolean;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
        return NextResponse.json({ error: 'Nama wajib diisi (maksimal 100 karakter).' }, { status: 400 });
      }
      data.name = name.trim();
    }
    if (email !== undefined) {
      if (
        typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        email.trim().length > 190
      ) {
        return NextResponse.json({ error: 'Alamat email tidak valid.' }, { status: 400 });
      }
      data.email = email.trim().toLowerCase();
    }
    if (phone !== undefined) {
      if (phone !== null && (typeof phone !== 'string' || phone.trim().length > 30)) {
        return NextResponse.json({ error: 'Nomor telepon tidak valid.' }, { status: 400 });
      }
      data.phone = typeof phone === 'string' && phone.trim() ? phone.trim() : null;
    }
    if (roleId !== undefined) {
      if (typeof roleId !== 'string') {
        return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
      }
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        select: { id: true, name: true },
      });
      if (!role) {
        return NextResponse.json({ error: 'Role yang dipilih tidak tersedia.' }, { status: 400 });
      }
      data.roleId = role.id;
    }
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
        return NextResponse.json(
          { error: 'Sandi baru wajib memiliki 8–128 karakter.' },
          { status: 400 }
        );
      }
      data.password = await bcrypt.hash(password, 10);
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json({ error: 'Status akun tidak valid.' }, { status: 400 });
      }
      data.isActive = isActive;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Tidak ada perubahan akun.' }, { status: 400 });
    }

    const targetRoleName =
      data.roleId === undefined
        ? user.role.name
        : (
            await prisma.role.findUniqueOrThrow({
              where: { id: data.roleId },
              select: { name: true },
            })
          ).name;
    const staysActive = data.isActive ?? user.isActive;
    if (
      user.role.name === 'SUPERADMIN' &&
      user.isActive &&
      (!staysActive || targetRoleName !== 'SUPERADMIN')
    ) {
      const activeSuperadmins = await prisma.user.count({
        where: {
          isActive: true,
          role: { name: 'SUPERADMIN' },
        },
      });
      if (activeSuperadmins <= 1) {
        return NextResponse.json(
          { error: 'Superadmin aktif terakhir tidak dapat dinonaktifkan atau diubah role.' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        role: { select: { id: true, name: true, displayName: true } },
      },
    });

    // Sinkronkan data kependudukan (Citizen) milik akun ini agar perubahan nama/no HP
    // dari Manajemen Admin langsung tercermin di Notifikasi Proses & Pengumuman Warga,
    // termasuk pada isi pesan WhatsApp/Email yang dikirim ke pemohon.
    if (data.name !== undefined || data.phone !== undefined) {
      const citizenData: { fullName?: string; phone?: string | null } = {};
      if (data.name !== undefined) citizenData.fullName = data.name;
      if (data.phone !== undefined) citizenData.phone = data.phone;
      await prisma.citizen.updateMany({
        where: { userId: user.id },
        data: citizenData,
      });
    }

    await logAudit({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: updatedUser.isActive ? 'UPDATE_USER' : 'DEACTIVATE_USER',
      entity: 'User',
      entityId: updatedUser.id,
      details: {
        changedFields: Object.keys(data).filter((field) => field !== 'password'),
        passwordChanged: password !== undefined,
        roleBefore: user.role.name,
        roleAfter: updatedUser.role.name,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Email tersebut sudah digunakan akun lain.' }, { status: 409 });
    }
    console.error('Update admin user error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui akun.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan login kembali.' }, { status: 401 });
    }
    if (currentUser.role !== 'SUPERADMIN') return unauthorized();

    const body: unknown = await req.json();
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Data akun tidak valid.' }, { status: 400 });
    }
    const { userId } = body as Record<string, unknown>;
    if (typeof userId !== 'string' || !userId) {
      return NextResponse.json({ error: 'ID akun wajib diisi.' }, { status: 400 });
    }
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Anda tidak dapat menghapus akun sendiri.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        isActive: true,
        role: { select: { name: true } },
        _count: {
          select: {
            applications: true,
            reviews: true,
            statusHistories: true,
            aiConversations: true,
          },
        },
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    if (user.role.name === 'SUPERADMIN' && user.isActive) {
      const activeSuperadmins = await prisma.user.count({
        where: { isActive: true, role: { name: 'SUPERADMIN' } },
      });
      if (activeSuperadmins <= 1) {
        return NextResponse.json(
          { error: 'Superadmin aktif terakhir tidak dapat dihapus.' },
          { status: 400 }
        );
      }
    }

    const relatedCount =
      user._count.applications +
      user._count.reviews +
      user._count.statusHistories +
      user._count.aiConversations;
    if (relatedCount > 0) {
      return NextResponse.json(
        {
          error:
            'Akun ini memiliki riwayat aktivitas (pengajuan/verifikasi) sehingga tidak dapat dihapus. Nonaktifkan saja agar data riwayat tetap utuh.',
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id: user.id } });

    await logAudit({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: user.id,
      details: { deletedName: user.name, deletedRole: user.role.name },
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${user.name} berhasil dihapus.`,
    });
  } catch (error) {
    console.error('Delete admin user error:', error);
    return NextResponse.json({ error: 'Gagal menghapus akun.' }, { status: 500 });
  }
}
