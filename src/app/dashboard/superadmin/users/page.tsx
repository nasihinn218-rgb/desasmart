'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import DashboardHeader from '@/components/DashboardHeader';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  role: { id: string; name: string; displayName: string };
  village: { name: string } | null;
}

interface ManagedRole {
  id: string;
  name: string;
  displayName: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  roleDisplayName?: string;
}

export default function SuperadminUsersPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<ManagedRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: '',
    password: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [meResponse, usersResponse] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/admin/users'),
      ]);
      const [meData, usersData] = await Promise.all([
        meResponse.json(),
        usersResponse.json(),
      ]);
      if (!meResponse.ok) throw new Error(meData.error || 'Sesi akun tidak valid.');
      if (!usersResponse.ok) throw new Error(usersData.error || 'Gagal memuat daftar akun.');
      setCurrentUser(meData.user);
      setUsers(usersData.users);
      setRoles(usersData.roles);
    } catch (loadError) {
      console.error('Load admin users error:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat daftar akun.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const openEditor = (user: ManagedUser) => {
    setSelectedUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      roleId: user.role.id,
      password: '',
    });
    setError('');
    setSuccess('');
  };

  const saveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const payload: Record<string, unknown> = {
      userId: selectedUser.id,
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      roleId: form.roleId,
    };
    if (form.password) payload.password = form.password;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Akun gagal diperbarui.');
      setSuccess('Perubahan akun berhasil disimpan.');
      setForm((previous) => ({ ...previous, password: '' }));
      await loadData();
      const refreshedUser = (result.user as ManagedUser | undefined) ?? null;
      if (refreshedUser) {
        setSelectedUser((previous) =>
          previous ? { ...previous, ...refreshedUser } : previous
        );
      }
    } catch (saveError) {
      console.error('Update managed account error:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Akun gagal diperbarui.');
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = async () => {
    if (!selectedUser) return;
    if (selectedUser.isActive) {
      const confirmed = window.confirm(
        `Nonaktifkan akun ${selectedUser.name}? Akun tidak bisa login, tetapi riwayatnya tetap tersimpan.`
      );
      if (!confirmed) return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, isActive: !selectedUser.isActive }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Akun gagal dinonaktifkan.');
      setSelectedUser((previous) =>
        previous ? { ...previous, isActive: !previous.isActive } : previous
      );
      setSuccess(
        selectedUser.isActive
          ? 'Akun dinonaktifkan. Riwayat data tetap tersimpan.'
          : 'Akun berhasil diaktifkan kembali.'
      );
      await loadData();
    } catch (deactivateError) {
      console.error('Deactivate managed account error:', deactivateError);
      setError(
        deactivateError instanceof Error
          ? deactivateError.message
          : 'Akun gagal dinonaktifkan.'
      );
    } finally {
      setSaving(false);
    }
  };

  const requestToggleStatus = async (target: ManagedUser) => {
    if (!currentUser || target.id === currentUser.id) return;
    if (target.isActive) {
      const confirmed = window.confirm(
        `Nonaktifkan akun ${target.name}? Akun tidak bisa login, tetapi riwayatnya tetap tersimpan.`
      );
      if (!confirmed) return;
    }
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: target.id, isActive: !target.isActive }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Status akun gagal diubah.');
      setSuccess(
        target.isActive
          ? `Akun ${target.name} dinonaktifkan.`
          : `Akun ${target.name} berhasil diaktifkan kembali.`
      );
      await loadData();
    } catch (toggleError) {
      console.error('Toggle managed account status error:', toggleError);
      setError(
        toggleError instanceof Error ? toggleError.message : 'Status akun gagal diubah.'
      );
    }
  };

  const deleteUser = async (target: ManagedUser) => {
    if (!currentUser || target.id === currentUser.id) return;
    const confirmed = window.confirm(
      `Hapus akun ${target.name} (${target.email}) secara permanen? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: target.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Akun gagal dihapus.');
      setSuccess(result.message || `Akun ${target.name} berhasil dihapus.`);
      await loadData();
    } catch (deleteError) {
      console.error('Delete managed account error:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Akun gagal dihapus.');
    }
  };

  const filteredUsers = users.filter((user) =>
    [user.name, user.email, user.role.displayName, user.village?.name ?? '']
      .join(' ')
      .toLocaleLowerCase('id-ID')
      .includes(search.toLocaleLowerCase('id-ID'))
  );

  if (loading && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <DashboardHeader
        user={
          currentUser ?? {
            id: '',
            name: 'Superadmin',
            email: '',
            role: 'SUPERADMIN',
          }
        }
      />
      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminSidebar role="SUPERADMIN" />
        <main className="min-w-0 flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          <section className="rounded-3xl border border-white/80 bg-gradient-to-r from-violet-800 via-purple-800 to-indigo-900 p-6 text-white shadow-xl shadow-violet-950/15 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <UserCog className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-200">
                  Portal Superadmin
                </p>
                <h1 className="text-2xl font-black sm:text-3xl">Manajemen Admin</h1>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-violet-100">
              Lihat semua akun di database dan ubah profil, peran, atau sandi. Akun
              yang dinonaktifkan tidak dapat login, tetapi data riwayatnya tetap utuh.
            </p>
          </section>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              {success}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <Users className="h-5 w-5 text-violet-600" />
                  Semua Akun ({filteredUsers.length})
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Kata sandi tidak pernah ditampilkan dan selalu tersimpan dalam bentuk hash.
                </p>
              </div>
              <label className="relative block sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama, email, role..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                  aria-label="Cari akun"
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Nama / Email</th>
                    <th className="px-5 py-3 font-semibold">Peran</th>
                    <th className="px-5 py-3 font-semibold">Desa</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/70">
                      <td className="max-w-[280px] px-5 py-4">
                        <p className="truncate font-semibold text-slate-900">{user.name}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{user.role.displayName}</td>
                      <td className="max-w-[180px] truncate px-5 py-4 text-slate-700">{user.village?.name ?? '—'}</td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => void requestToggleStatus(user)}
                          disabled={user.id === currentUser?.id}
                          title={
                            user.id === currentUser?.id
                              ? 'Akun yang sedang digunakan'
                              : user.isActive
                                ? 'Klik untuk menonaktifkan'
                                : 'Klik untuk mengaktifkan'
                          }
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditor(user)}
                            title={
                              user.id === currentUser?.id
                                ? 'Lihat akun Superadmin yang sedang digunakan'
                                : 'Lihat dan kelola akun'
                            }
                            aria-label={`Lihat dan kelola akun ${user.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Settings2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteUser(user)}
                            disabled={user.id === currentUser?.id}
                            title="Hapus akun permanen"
                            aria-label={`Hapus akun ${user.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                        Tidak ada akun yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-violet-600" />
              Akun Superadmin yang sedang digunakan dilindungi dari perubahan lewat tabel ini.
            </div>
          </section>
        </main>
      </div>

      {selectedUser && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setSelectedUser(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-editor-title"
            className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <h2 id="user-editor-title" className="font-bold text-slate-900">
                  Lihat / Edit Akun
                </h2>
                <p className="mt-1 text-xs text-slate-500">{selectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                disabled={saving}
                aria-label="Tutup"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <form onSubmit={saveUser} className="space-y-4 p-5">
              {selectedUser.id === currentUser?.id && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Akun Superadmin yang sedang digunakan dapat dilihat, tetapi tidak dapat diubah dari menu ini.
                </p>
              )}
              <label className="block text-sm font-medium text-slate-700">
                Nama
                <input
                  required
                  maxLength={100}
                  readOnly={selectedUser.id === currentUser?.id}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  required
                  type="email"
                  maxLength={190}
                  readOnly={selectedUser.id === currentUser?.id}
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Nomor telepon
                <input
                  maxLength={30}
                  readOnly={selectedUser.id === currentUser?.id}
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Peran
                <select
                  required
                  disabled={selectedUser.id === currentUser?.id}
                  value={form.roleId}
                  onChange={(event) => setForm({ ...form, roleId: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Sandi baru
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  disabled={selectedUser.id === currentUser?.id}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="Kosongkan jika tidak ingin mengganti sandi"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Minimal 8 karakter. Sandi lama tidak dapat dilihat.
                </span>
              </label>
              {error && (
                <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
                  {error}
                </p>
              )}
              {success && (
                <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                  {success}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => void toggleUserStatus()}
                  disabled={saving || selectedUser.id === currentUser?.id}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedUser.isActive
                      ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {selectedUser.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                </button>
                <div className="flex gap-2 sm:ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    disabled={saving}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex-none"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={saving || selectedUser.id === currentUser?.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60 sm:flex-none"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
